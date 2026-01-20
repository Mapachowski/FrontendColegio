import React, { useState } from 'react';
import { Card, Input, Button, Table, message, Modal, Form, Typography, Tag, Space } from 'antd';
import { SearchOutlined, KeyOutlined, UserOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { registrarResetPassword } from '../../../utils/bitacora';

const { Title, Text } = Typography;

const CredencialesAccesoDocentes = () => {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [form] = Form.useForm();

  // Buscar docentes con usuarios activos (IdRol = 4)
  const buscarDocentes = async () => {
    if (!busqueda.trim()) {
      message.warning('Por favor ingresa un criterio de búsqueda');
      return;
    }

    setLoading(true);
    try {
      // Buscar en todos los docentes
      const response = await apiClient.get('/docentes');

      if (response.data.success && response.data.data) {
        let todosLosDocentes = response.data.data;

        // Manejar estructura anidada si existe
        if (!Array.isArray(todosLosDocentes)) {
          todosLosDocentes = Object.values(todosLosDocentes);
        }

        // Filtrar solo docentes con usuario (idUsuario !== null) y que coincidan con búsqueda
        const docentesFiltrados = todosLosDocentes.filter((docente) => {
          const tieneUsuario = docente.idUsuario !== null && docente.idUsuario !== undefined;
          const nombreUsuario = docente.Usuario?.NombreUsuario || '';
          const coincideBusqueda =
            (docente.NombreDocente || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            nombreUsuario.toLowerCase().includes(busqueda.toLowerCase()) ||
            (docente.Email || '').toLowerCase().includes(busqueda.toLowerCase());

          return tieneUsuario && coincideBusqueda;
        });

        setDocentes(docentesFiltrados);

        if (docentesFiltrados.length === 0) {
          message.info('No se encontraron docentes con usuario que coincidan con la búsqueda');
        } else {
          message.success(`${docentesFiltrados.length} docente(s) encontrado(s)`);
        }
      } else {
        setDocentes([]);
        message.info('No se encontraron docentes');
      }
    } catch (error) {
      message.error('Error al buscar docentes');
      setDocentes([]);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para resetear contraseña
  const abrirModalResetPassword = (docente) => {
    setDocenteSeleccionado(docente);
    setModalVisible(true);
    form.resetFields();
  };

  // Resetear contraseña al nombre de usuario del docente
  const resetearPasswordAlUsuario = async () => {
    try {
      const nombreUsuario = docenteSeleccionado.Usuario?.NombreUsuario;

      const payload = {
        Contrasena: nombreUsuario,
      };

      const response = await apiClient.put(
        `/usuarios/soft-reset/${docenteSeleccionado.idUsuario}`,
        payload
      );

      if (response.data.success) {
        // Registrar en bitácora
        await registrarResetPassword(
          `${docenteSeleccionado.NombreDocente} (Usuario: ${nombreUsuario})`
        );

        message.success({
          content: (
            <div>
              <strong>✅ Contraseña reseteada exitosamente</strong>
              <br />
              <br />
              Usuario: <code>{nombreUsuario}</code>
              <br />
              Contraseña: <code>{nombreUsuario}</code>
              <br />
              <br />
              <small>El docente debe cambiar su contraseña al ingresar</small>
            </div>
          ),
          duration: 8,
        });
        setModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      const mensajeError = error.response?.data?.error || error.response?.data?.message || 'Error al resetear contraseña';
      message.error(mensajeError);
    }
  };

  const columnas = [
    {
      title: 'ID',
      dataIndex: 'idDocente',
      key: 'idDocente',
      width: 80,
      align: 'center',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Nombre del Docente',
      dataIndex: 'NombreDocente',
      key: 'NombreDocente',
      width: 250,
    },
    {
      title: 'Usuario',
      key: 'NombreUsuario',
      width: 150,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <Text code>{record.Usuario?.NombreUsuario || 'N/A'}</Text>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'Estado',
      width: 100,
      align: 'center',
      render: (estado) => (
        <Tag color={estado ? 'green' : 'red'}>
          {estado ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 220,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<KeyOutlined />}
          onClick={() => abrirModalResetPassword(record)}
          size="small"
          danger
        >
          Resetear a Usuario
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <TeamOutlined /> Credenciales de Acceso - Docentes
      </Title>
      <Text type="secondary">
        Busca y administra las credenciales de acceso de los docentes
      </Text>

      <Card style={{ marginTop: 24, marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Input
              placeholder="Buscar por nombre, usuario o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onPressEnter={buscarDocentes}
              prefix={<SearchOutlined />}
              size="large"
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={buscarDocentes}
              loading={loading}
              size="large"
            >
              Buscar
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setBusqueda('');
                setDocentes([]);
              }}
              size="large"
            >
              Limpiar
            </Button>
          </div>
        </Space>
      </Card>

      {docentes.length > 0 && (
        <Card title={`${docentes.length} docente(s) encontrado(s)`}>
          <Table
            columns={columnas}
            dataSource={docentes}
            rowKey={(record) => record.idUsuario || record.idDocente}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Total: ${total} docentes`
            }}
            bordered
          />
        </Card>
      )}

      {/* Modal para resetear contraseña */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#ff4d4f' }} />
            <span>Resetear Contraseña al Nombre de Usuario</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={resetearPasswordAlUsuario}
        okText="Sí, Resetear Contraseña"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, icon: <KeyOutlined /> }}
        width={600}
      >
        {docenteSeleccionado && (
          <div>
            <Card size="small" style={{ marginBottom: 24, backgroundColor: '#fff7e6', borderColor: '#ffa940' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>ID Docente: </Text>
                  <Tag color="blue">{docenteSeleccionado.idDocente}</Tag>
                </div>
                <div>
                  <Text strong>Nombre: </Text>
                  <Text>{docenteSeleccionado.NombreDocente}</Text>
                </div>
                <div>
                  <Text strong>Usuario Actual: </Text>
                  <Text code>{docenteSeleccionado.Usuario?.NombreUsuario}</Text>
                </div>
                <div>
                  <Text strong>Email: </Text>
                  <Text>{docenteSeleccionado.Email || 'No especificado'}</Text>
                </div>
              </Space>
            </Card>

            <Card
              size="small"
              style={{
                marginBottom: 24,
                backgroundColor: '#e6f7ff',
                borderColor: '#1890ff'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong style={{ color: '#1890ff' }}>📋 Nueva Contraseña:</Text>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px dashed #1890ff'
                }}>
                  <Text code style={{ fontSize: 18, fontWeight: 'bold' }}>
                    {docenteSeleccionado.Usuario?.NombreUsuario}
                  </Text>
                </div>
              </Space>
            </Card>

            <div style={{
              padding: 16,
              backgroundColor: '#fffbe6',
              borderRadius: 4,
              border: '1px solid #ffe58f'
            }}>
              <Text type="warning" strong>⚠️ Importante:</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>La contraseña se reseteará al nombre de usuario del docente</li>
                <li>El docente podrá cambiar su contraseña después de ingresar</li>
                <li>Anota esta información para dársela al docente</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <div style={{ marginTop: 40, textAlign: 'center', paddingBottom: 24 }}>
        <Button
          size="large"
          onClick={() => navigate('/dashboard')}
          style={{ minWidth: 200 }}
        >
          Regresar al Dashboard
        </Button>
      </div>
    </div>
  );
};

export default CredencialesAccesoDocentes;

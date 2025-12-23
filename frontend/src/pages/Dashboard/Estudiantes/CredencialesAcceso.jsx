import React, { useState } from 'react';
import { Card, Input, Button, Table, message, Modal, Form, Typography, Tag, Space } from 'antd';
import { SearchOutlined, KeyOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { registrarResetPassword } from '../../../utils/bitacora';

const { Title, Text } = Typography;

const CredencialesAcceso = () => {
  const navigate = useNavigate();
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [form] = Form.useForm();

  // Buscar alumnos con usuarios activos (IdRol = 5)
  const buscarAlumnos = async () => {
    if (!busqueda.trim()) {
      message.warning('Por favor ingresa un criterio de búsqueda');
      return;
    }

    setLoading(true);
    try {
      // Buscar en todos los alumnos
      const response = await apiClient.get('/alumnos');

      if (response.data.success && response.data.data) {
        let todosLosAlumnos = response.data.data;

        // Manejar estructura anidada si existe
        if (!Array.isArray(todosLosAlumnos)) {
          todosLosAlumnos = Object.values(todosLosAlumnos);
        }

        // Filtrar solo alumnos con usuario (IdUsuario !== null) y que coincidan con búsqueda
        const alumnosFiltrados = todosLosAlumnos.filter((alumno) => {
          const tieneUsuario = alumno.IdUsuario !== null && alumno.IdUsuario !== undefined;
          const coincideBusqueda =
            String(alumno.IdAlumno || alumno.Carnet || '').includes(busqueda) ||
            (alumno.Nombres || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (alumno.Apellidos || '').toLowerCase().includes(busqueda.toLowerCase()) ||
            (alumno.Matricula || '').toLowerCase().includes(busqueda.toLowerCase());

          return tieneUsuario && coincideBusqueda;
        });

        // Obtener información completa de cada alumno (incluye usuario)
        const alumnosConDetalle = await Promise.all(
          alumnosFiltrados.map(async (alumno) => {
            try {
              const detalle = await apiClient.get(`/alumnos/${alumno.IdAlumno}`);
              return detalle.data.data;
            } catch (err) {
              console.error(`Error al obtener alumno ${alumno.IdAlumno}:`, err);
              return alumno;
            }
          })
        );

        setAlumnos(alumnosConDetalle);

        if (alumnosConDetalle.length === 0) {
          message.info('No se encontraron alumnos con usuario que coincidan con la búsqueda');
        } else {
          message.success(`${alumnosConDetalle.length} alumno(s) encontrado(s)`);
        }
      } else {
        setAlumnos([]);
        message.info('No se encontraron alumnos');
      }
    } catch (error) {
      console.error('Error al buscar alumnos:', error);
      message.error('Error al buscar alumnos');
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para resetear contraseña
  const abrirModalResetPassword = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setModalVisible(true);
    form.resetFields();
  };

  // Resetear contraseña al carnet del alumno
  const resetearPasswordAlCarnet = async () => {
    try {
      const carnet = String(alumnoSeleccionado.IdAlumno || alumnoSeleccionado.Carnet);

      const payload = {
        Contrasena: carnet,
      };

      const response = await apiClient.put(
        `/usuarios/soft-reset/${alumnoSeleccionado.IdUsuario}`,
        payload
      );

      if (response.data.success) {
        // Registrar en bitácora
        await registrarResetPassword(
          `${alumnoSeleccionado.Nombres} ${alumnoSeleccionado.Apellidos} (Carnet: ${carnet})`
        );

        message.success({
          content: (
            <div>
              <strong>✅ Contraseña reseteada exitosamente</strong>
              <br />
              <br />
              Usuario: <code>{alumnoSeleccionado.Usuario?.NombreUsuario || carnet}</code>
              <br />
              Contraseña: <code>{carnet}</code>
              <br />
              <br />
              <small>El alumno debe cambiar su contraseña al ingresar</small>
            </div>
          ),
          duration: 8,
        });
        setModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      const mensajeError = error.response?.data?.error || error.response?.data?.message || 'Error al resetear contraseña';
      message.error(mensajeError);
    }
  };

  const columnas = [
    {
      title: 'Carnet',
      dataIndex: 'IdAlumno',
      key: 'IdAlumno',
      width: 120,
      align: 'center',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Matrícula',
      dataIndex: 'Matricula',
      key: 'Matricula',
      width: 150,
      align: 'center'
    },
    {
      title: 'Nombre Completo',
      key: 'NombreCompleto',
      width: 250,
      render: (_, record) => `${record.Nombres || ''} ${record.Apellidos || ''}`
    },
    {
      title: 'Usuario',
      key: 'Usuario',
      width: 150,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <Text code>{record.Usuario?.NombreUsuario || record.IdAlumno}</Text>
        </Space>
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<KeyOutlined />}
          onClick={() => abrirModalResetPassword(record)}
          size="small"
          danger
        >
          Resetear a Carnet
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <KeyOutlined /> Credenciales de Acceso - Alumnos
      </Title>
      <Text type="secondary">
        Busca y administra las credenciales de acceso de los alumnos
      </Text>

      <Card style={{ marginTop: 24, marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Input
              placeholder="Buscar por carnet, nombre o usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onPressEnter={buscarAlumnos}
              prefix={<SearchOutlined />}
              size="large"
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={buscarAlumnos}
              loading={loading}
              size="large"
            >
              Buscar
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setBusqueda('');
                setAlumnos([]);
              }}
              size="large"
            >
              Limpiar
            </Button>
          </div>
        </Space>
      </Card>

      {alumnos.length > 0 && (
        <Card title={`${alumnos.length} alumno(s) encontrado(s)`}>
          <Table
            columns={columnas}
            dataSource={alumnos}
            rowKey={(record) => record.IdUsuario || record.Carnet}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Total: ${total} alumnos`
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
            <span>Resetear Contraseña al Carnet</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={resetearPasswordAlCarnet}
        okText="Sí, Resetear Contraseña"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, icon: <KeyOutlined /> }}
        width={600}
      >
        {alumnoSeleccionado && (
          <div>
            <Card size="small" style={{ marginBottom: 24, backgroundColor: '#fff7e6', borderColor: '#ffa940' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Carnet: </Text>
                  <Tag color="blue">{alumnoSeleccionado.IdAlumno}</Tag>
                </div>
                <div>
                  <Text strong>Nombre: </Text>
                  <Text>{alumnoSeleccionado.Nombres} {alumnoSeleccionado.Apellidos}</Text>
                </div>
                <div>
                  <Text strong>Usuario Actual: </Text>
                  <Text code>{alumnoSeleccionado.Usuario?.NombreUsuario || alumnoSeleccionado.IdAlumno}</Text>
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
                    {alumnoSeleccionado.IdAlumno}
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
                <li>La contraseña se reseteará al número de carnet del alumno</li>
                <li>El alumno podrá cambiar su contraseña después de ingresar</li>
                <li>Anota esta información para dársela al alumno</li>
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

export default CredencialesAcceso;

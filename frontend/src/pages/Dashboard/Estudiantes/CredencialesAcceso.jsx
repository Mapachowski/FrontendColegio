import React, { useState } from 'react';
import { Card, Input, Button, Table, message, Modal, Form, Typography, Tag, Space, Tabs } from 'antd';
import { SearchOutlined, KeyOutlined, UserOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { registrarResetPassword } from '../../../utils/bitacora';

const { Title, Text } = Typography;

const CredencialesAcceso = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('alumnos');

  // Estados para Alumnos
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [busquedaAlumnos, setBusquedaAlumnos] = useState('');
  const [modalAlumnoVisible, setModalAlumnoVisible] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  // Estados para Familias
  const [familias, setFamilias] = useState([]);
  const [loadingFamilias, setLoadingFamilias] = useState(false);
  const [busquedaFamilias, setBusquedaFamilias] = useState('');
  const [modalFamiliaVisible, setModalFamiliaVisible] = useState(false);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState(null);

  const [form] = Form.useForm();

  // ==================== ALUMNOS ====================
  // Buscar alumnos con usuarios activos (IdRol = 5)
  const buscarAlumnos = async () => {
    if (!busquedaAlumnos.trim()) {
      message.warning('Por favor ingresa un criterio de búsqueda');
      return;
    }

    setLoadingAlumnos(true);
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
            String(alumno.IdAlumno || alumno.Carnet || '').includes(busquedaAlumnos) ||
            (alumno.Nombres || '').toLowerCase().includes(busquedaAlumnos.toLowerCase()) ||
            (alumno.Apellidos || '').toLowerCase().includes(busquedaAlumnos.toLowerCase()) ||
            (alumno.Matricula || '').toLowerCase().includes(busquedaAlumnos.toLowerCase());

          return tieneUsuario && coincideBusqueda;
        });

        // Obtener información completa de cada alumno (incluye usuario)
        const alumnosConDetalle = await Promise.all(
          alumnosFiltrados.map(async (alumno) => {
            try {
              const detalle = await apiClient.get(`/alumnos/${alumno.IdAlumno}`);
              return detalle.data.data;
            } catch (err) {
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
      message.error('Error al buscar alumnos');
      setAlumnos([]);
    } finally {
      setLoadingAlumnos(false);
    }
  };

  // Abrir modal para resetear contraseña de alumno
  const abrirModalResetPasswordAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setModalAlumnoVisible(true);
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
        setModalAlumnoVisible(false);
        form.resetFields();
      }
    } catch (error) {
      const mensajeError = error.response?.data?.error || error.response?.data?.message || 'Error al resetear contraseña';
      message.error(mensajeError);
    }
  };

  const columnasAlumnos = [
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
          onClick={() => abrirModalResetPasswordAlumno(record)}
          size="small"
          danger
        >
          Resetear a Carnet
        </Button>
      )
    }
  ];

  // ==================== FAMILIAS ====================
  // Buscar familias usando responsables activos (que ya traen IdUsuario, IdFamilia, NombresHijos)
  const buscarFamilias = async () => {
    if (!busquedaFamilias.trim()) {
      message.warning('Por favor ingresa un criterio de búsqueda');
      return;
    }

    setLoadingFamilias(true);
    const busquedaLower = busquedaFamilias.toLowerCase().trim();

    try {
      // Obtener responsables activos (ya trae IdUsuario, IdFamilia, NombresHijos, CantidadHijos)
      const response = await apiClient.get('/responsables/activos');

      let responsablesLimpios = [];
      if (response.data.success && response.data.data) {
        const datosReales = response.data.data[0];
        if (datosReales) {
          responsablesLimpios = Object.values(datosReales);
        }
      }

      // Filtrar responsables que coincidan con la búsqueda y tengan IdUsuario
      const familiasResultado = responsablesLimpios
        .filter(r => {
          // Solo responsables con usuario asociado
          if (!r.IdUsuario) return false;

          // Filtrar por búsqueda
          return (
            (r.NombreResponsable || '').toLowerCase().includes(busquedaLower) ||
            (r.DPI || '').toLowerCase().includes(busquedaLower) ||
            (r.NIT || '').toLowerCase().includes(busquedaLower) ||
            (r.NombresHijos || '').toLowerCase().includes(busquedaLower) ||
            (r.TelefonoContacto || '').includes(busquedaFamilias) ||
            String(r.IdResponsable || '').includes(busquedaFamilias)
          );
        })
        .map(r => ({
          IdResponsable: r.IdResponsable,
          NombreResponsable: r.NombreResponsable,
          TipoResponsable: r.TipoResponsable || 'Familia',
          DPI: r.DPI,
          NIT: r.NIT,
          NombresHijos: r.NombresHijos,
          CantidadHijos: r.CantidadHijos,
          IdUsuario: r.IdUsuario,
          IdFamilia: r.IdFamilia,
          Usuario: { IdUsuario: r.IdUsuario }
        }));

      // Eliminar duplicados por IdUsuario (una familia puede tener varios responsables)
      const familiasUnicas = [];
      const idsVistos = new Set();
      familiasResultado.forEach(f => {
        if (!idsVistos.has(f.IdUsuario)) {
          idsVistos.add(f.IdUsuario);
          familiasUnicas.push(f);
        }
      });

      // Obtener NombreUsuario para cada familia encontrada
      const familiasConUsuario = await Promise.all(
        familiasUnicas.map(async (familia) => {
          try {
            const res = await apiClient.get(`/usuarios/${familia.IdUsuario}`);
            const usuario = res.data.data || res.data;
            return { ...familia, Usuario: usuario };
          } catch {
            return familia;
          }
        })
      );

      setFamilias(familiasConUsuario);

      if (familiasConUsuario.length === 0) {
        message.info('No se encontraron familias con usuario que coincidan con la búsqueda');
      } else {
        message.success(`${familiasConUsuario.length} familia(s) encontrada(s)`);
      }
    } catch (error) {
      message.error('Error al buscar familias');
      setFamilias([]);
    } finally {
      setLoadingFamilias(false);
    }
  };

  // Abrir modal para resetear contraseña de familia
  const abrirModalResetPasswordFamilia = (familia) => {
    setFamiliaSeleccionada(familia);
    setModalFamiliaVisible(true);
    form.resetFields();
  };

  // Resetear contraseña a 123456 para familia
  const resetearPasswordFamilia = async () => {
    try {
      const payload = {
        Contrasena: '123456',
      };

      const response = await apiClient.put(
        `/usuarios/soft-reset/${familiaSeleccionada.IdUsuario}`,
        payload
      );

      if (response.data.success) {
        // Registrar en bitácora
        await registrarResetPassword(
          `Familia: ${familiaSeleccionada.NombreResponsable} (DPI: ${familiaSeleccionada.DPI || 'N/A'})`
        );

        message.success({
          content: (
            <div>
              <strong>✅ Contraseña reseteada exitosamente</strong>
              <br />
              <br />
              Usuario: <code>{familiaSeleccionada.Usuario?.NombreUsuario || familiaSeleccionada.DPI}</code>
              <br />
              Contraseña: <code>123456</code>
              <br />
              <br />
              <small>El responsable debe cambiar su contraseña al ingresar</small>
            </div>
          ),
          duration: 8,
        });
        setModalFamiliaVisible(false);
        form.resetFields();
      }
    } catch (error) {
      const mensajeError = error.response?.data?.error || error.response?.data?.message || 'Error al resetear contraseña';
      message.error(mensajeError);
    }
  };

  const columnasFamilias = [
    {
      title: 'ID',
      dataIndex: 'IdResponsable',
      key: 'IdResponsable',
      width: 80,
      align: 'center',
      render: (text) => <Tag color="purple">{text}</Tag>
    },
    {
      title: 'Nombre Responsable',
      dataIndex: 'NombreResponsable',
      key: 'NombreResponsable',
      width: 250,
    },
    {
      title: 'Tipo',
      dataIndex: 'TipoResponsable',
      key: 'TipoResponsable',
      width: 120,
    },
    {
      title: 'DPI',
      dataIndex: 'DPI',
      key: 'DPI',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Usuario',
      key: 'Usuario',
      width: 150,
      render: (_, record) => (
        <Space>
          <TeamOutlined />
          <Text code>{record.Usuario?.NombreUsuario || record.DPI || '-'}</Text>
        </Space>
      )
    },
    {
      title: 'Hijos',
      dataIndex: 'NombresHijos',
      key: 'NombresHijos',
      width: 300,
      render: (text) => text || '-'
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
          onClick={() => abrirModalResetPasswordFamilia(record)}
          size="small"
          danger
        >
          Resetear a 123456
        </Button>
      )
    }
  ];

  // ==================== RENDER ====================
  const items = [
    {
      key: 'alumnos',
      label: (
        <span>
          <UserOutlined />
          Alumnos
        </span>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Input
                  placeholder="Buscar por carnet, nombre o usuario..."
                  value={busquedaAlumnos}
                  onChange={(e) => setBusquedaAlumnos(e.target.value)}
                  onPressEnter={buscarAlumnos}
                  prefix={<SearchOutlined />}
                  size="large"
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={buscarAlumnos}
                  loading={loadingAlumnos}
                  size="large"
                >
                  Buscar
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setBusquedaAlumnos('');
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
                columns={columnasAlumnos}
                dataSource={alumnos}
                rowKey={(record) => record.IdUsuario || record.Carnet}
                loading={loadingAlumnos}
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
        </>
      ),
    },
    {
      key: 'familias',
      label: (
        <span>
          <TeamOutlined />
          Familias
        </span>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Input
                  placeholder="Buscar por nombre familia, DPI  o nombre del responsable..."
                  value={busquedaFamilias}
                  onChange={(e) => setBusquedaFamilias(e.target.value)}
                  onPressEnter={buscarFamilias}
                  prefix={<SearchOutlined />}
                  size="large"
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={buscarFamilias}
                  loading={loadingFamilias}
                  size="large"
                >
                  Buscar
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setBusquedaFamilias('');
                    setFamilias([]);
                  }}
                  size="large"
                >
                  Limpiar
                </Button>
              </div>
            </Space>
          </Card>

          {familias.length > 0 && (
            <Card title={`${familias.length} familia(s) encontrada(s)`}>
              <Table
                columns={columnasFamilias}
                dataSource={familias}
                rowKey={(record) => record.IdResponsable}
                loading={loadingFamilias}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total) => `Total: ${total} familias`
                }}
                scroll={{ x: 1200 }}
                bordered
              />
            </Card>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <KeyOutlined /> Credenciales de Acceso
      </Title>
      <Text type="secondary">
        Busca y administra las credenciales de acceso de alumnos y familias
      </Text>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        size="large"
        style={{ marginTop: 24 }}
      />

      {/* Modal para resetear contraseña de Alumno */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#ff4d4f' }} />
            <span>Resetear Contraseña al Carnet</span>
          </Space>
        }
        open={modalAlumnoVisible}
        onCancel={() => {
          setModalAlumnoVisible(false);
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
                <Text strong style={{ color: '#1890ff' }}>Nueva Contraseña:</Text>
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
              <Text type="warning" strong>Importante:</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>La contraseña se reseteará al número de carnet del alumno</li>
                <li>El alumno podrá cambiar su contraseña después de ingresar</li>
                <li>Anota esta información para dársela al alumno</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para resetear contraseña de Familia */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#ff4d4f' }} />
            <span>Resetear Contraseña de Familia</span>
          </Space>
        }
        open={modalFamiliaVisible}
        onCancel={() => {
          setModalFamiliaVisible(false);
          form.resetFields();
        }}
        onOk={resetearPasswordFamilia}
        okText="Sí, Resetear Contraseña"
        cancelText="Cancelar"
        okButtonProps={{ danger: true, icon: <KeyOutlined /> }}
        width={600}
      >
        {familiaSeleccionada && (
          <div>
            <Card size="small" style={{ marginBottom: 24, backgroundColor: '#f9f0ff', borderColor: '#d3adf7' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>ID Responsable: </Text>
                  <Tag color="purple">{familiaSeleccionada.IdResponsable}</Tag>
                </div>
                <div>
                  <Text strong>Nombre: </Text>
                  <Text>{familiaSeleccionada.NombreResponsable}</Text>
                </div>
                <div>
                  <Text strong>Tipo: </Text>
                  <Text>{familiaSeleccionada.TipoResponsable}</Text>
                </div>
                <div>
                  <Text strong>DPI: </Text>
                  <Text>{familiaSeleccionada.DPI || '-'}</Text>
                </div>
                <div>
                  <Text strong>Usuario Actual: </Text>
                  <Text code>{familiaSeleccionada.Usuario?.NombreUsuario || familiaSeleccionada.DPI || '-'}</Text>
                </div>
                {familiaSeleccionada.NombresHijos && (
                  <div>
                    <Text strong>Hijos: </Text>
                    <Text>{familiaSeleccionada.NombresHijos}</Text>
                  </div>
                )}
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
                <Text strong style={{ color: '#1890ff' }}>Nueva Contraseña:</Text>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  border: '1px dashed #1890ff'
                }}>
                  <Text code style={{ fontSize: 18, fontWeight: 'bold' }}>
                    123456
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
              <Text type="warning" strong>Importante:</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>La contraseña se reseteará a <strong>123456</strong></li>
                <li>El responsable debe cambiar su contraseña después de ingresar</li>
                <li>Recuerde informar al responsable de esta nueva contraseña</li>
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

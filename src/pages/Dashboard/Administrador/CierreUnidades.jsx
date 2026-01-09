import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  message,
  Spin,
  Empty,
  Tag,
  Table,
  Space,
  Select,
  Row,
  Col,
  Statistic,
  Modal
} from 'antd';
import {
  LockOutlined,
  BellOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import apiClient from '../../../api/apiClient';

const { Option } = Select;

const CierreUnidades = ({ user }) => {
  const [unidades, setUnidades] = useState([]);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [cursosData, setCursosData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [modalNotificarVisible, setModalNotificarVisible] = useState(false);
  const [modalCerrarVisible, setModalCerrarVisible] = useState(false);

  // Verificar si el usuario es admin o operador (roles 1 y 2)
  const esAdminOOperador = user?.rol === 1 || user?.rol === 2;

  useEffect(() => {
    cargarUnidades();
  }, []);

  useEffect(() => {
    if (unidadSeleccionada) {
      cargarDatosUnidad(unidadSeleccionada);
    }
  }, [unidadSeleccionada]);

  const cargarUnidades = async () => {
    setLoading(true);
    try {
      // Crear manualmente las 4 unidades para el selector
      const unidadesData = [
        { NumeroUnidad: 1, NombreUnidad: 'Primera Unidad' },
        { NumeroUnidad: 2, NombreUnidad: 'Segunda Unidad' },
        { NumeroUnidad: 3, NombreUnidad: 'Tercera Unidad' },
        { NumeroUnidad: 4, NombreUnidad: 'Cuarta Unidad' }
      ];

      setUnidades(unidadesData);

      // Seleccionar la primera unidad por defecto
      if (!unidadSeleccionada) {
        setUnidadSeleccionada(1); // Seleccionar NumeroUnidad = 1
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
      message.error('Error al cargar las unidades');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosUnidad = async (numeroUnidad) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/cierre-unidades/estado-por-numero/${numeroUnidad}`);
      if (response.data.success) {
        const data = response.data.data;

        // Filtrar solo cursos NO listos (PENDIENTE o INCOMPLETO)
        const cursosNoListos = data.cursos?.filter(c => c.EstadoGeneral !== 'LISTO') || [];

        setCursosData({
          ...data,
          cursosNoListos,
          totalCursos: data.resumen.totalCursos,
          cursosListos: data.resumen.cursosListos,
          cursosPendientes: data.resumen.cursosPendientes,
          cursosIncompletos: data.resumen.cursosIncompletos,
          numeroUnidad
        });
      }
    } catch (error) {
      console.error('Error al cargar datos de unidad:', error);
      message.error('Error al cargar datos de la unidad');
      setCursosData(null);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async () => {
    if (!unidadSeleccionada) return;

    setLoading(true);
    try {
      // Simplemente recargar los datos desde la caché (instantáneo)
      // El estado ya se actualiza automáticamente al crear/editar actividades o calificar
      await cargarDatosUnidad(unidadSeleccionada);
      message.success('Vista actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      message.error('Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const cerrarCursosListos = () => {
    console.log('🎯 cerrarCursosListos LLAMADA');
    console.log('📊 Datos:', { unidadSeleccionada, cursosListos: cursosData?.cursosListos });

    if (!unidadSeleccionada || !cursosData || cursosData.cursosListos === 0) {
      console.log('⚠️ No hay cursos listos para cerrar');
      message.warning('No hay cursos listos para cerrar');
      return;
    }

    console.log('📝 Mostrando modal de cierre');
    setModalCerrarVisible(true);
  };

  const handleConfirmarCierre = async () => {
    console.log('✅ Usuario confirmó el cierre');
    setProcesando(true);
    setModalCerrarVisible(false);

    try {
      const url = `/cierre-unidades/cerrar-cursos-listos-por-numero/${unidadSeleccionada}`;
      console.log('📤 Enviando POST a:', url);
      const response = await apiClient.post(url);
      console.log('📥 Respuesta recibida:', response.data);
      if (response.data.success) {
        message.success(response.data.message);
        await cargarDatosUnidad(unidadSeleccionada);
      }
    } catch (error) {
      console.error('❌ Error al cerrar cursos:', error);
      const errorMsg = error.response?.data?.error || 'Error al cerrar los cursos';
      message.error(errorMsg);
    } finally {
      setProcesando(false);
    }
  };

  const notificarPendientes = () => {
    console.log('🔔 notificarPendientes LLAMADA');

    if (!unidadSeleccionada || !cursosData) {
      message.warning('No hay datos para notificar');
      return;
    }

    const totalPendientes = cursosData.cursosPendientes + cursosData.cursosIncompletos;
    console.log('📊 Total pendientes:', totalPendientes);

    if (totalPendientes === 0) {
      message.info('No hay cursos con pendientes para notificar');
      return;
    }

    console.log('📝 Mostrando modal');
    setModalNotificarVisible(true);
  };

  const handleConfirmarNotificacion = async () => {
    console.log('✅ Usuario confirmó notificación');
    setProcesando(true);
    setModalNotificarVisible(false);

    try {
      const url = `/notificaciones-docentes/generar-por-numero/${unidadSeleccionada}`;
      console.log('📤 Enviando POST a:', url);
      const response = await apiClient.post(url);
      console.log('📥 Respuesta recibida:', response.data);
      if (response.data.success) {
        message.success(`${response.data.notificacionesCreadas || 0} notificaciones enviadas con plazo de 3 días`);
      }
    } catch (error) {
      console.error('❌ Error al notificar:', error);
      const errorMsg = error.response?.data?.error || 'Error al enviar notificaciones';
      message.error(errorMsg);
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoTag = (estado) => {
    const config = {
      LISTO: { color: 'success', icon: <CheckCircleOutlined />, text: 'Listo' },
      PENDIENTE: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pendiente' },
      INCOMPLETO: { color: 'error', icon: <CloseCircleOutlined />, text: 'Incompleto' }
    };

    const { color, icon, text } = config[estado] || config.PENDIENTE;
    return <Tag icon={icon} color={color}>{text}</Tag>;
  };

  const columnas = [
    {
      title: 'Grado',
      dataIndex: 'NombreGrado',
      key: 'NombreGrado',
      width: 100,
      sorter: (a, b) => {
        // Extraer el número del grado para ordenar correctamente
        const gradoA = parseInt(a.NombreGrado.match(/\d+/)?.[0] || 0);
        const gradoB = parseInt(b.NombreGrado.match(/\d+/)?.[0] || 0);
        return gradoA - gradoB;
      },
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Sección',
      dataIndex: 'NombreSeccion',
      key: 'NombreSeccion',
      width: 100,
      sorter: (a, b) => a.NombreSeccion.localeCompare(b.NombreSeccion)
    },
    {
      title: 'Curso',
      dataIndex: 'NombreCurso',
      key: 'NombreCurso',
      width: 180
    },
    {
      title: 'Jornada',
      dataIndex: 'NombreJornada',
      key: 'NombreJornada',
      width: 120
    },
    {
      title: 'Docente',
      dataIndex: 'NombreDocente',
      key: 'NombreDocente',
      width: 180
    },
    {
      title: 'Estado',
      dataIndex: 'EstadoGeneral',
      key: 'EstadoGeneral',
      width: 130,
      align: 'center',
      render: (estado) => getEstadoTag(estado),
      filters: [
        { text: 'Pendiente', value: 'PENDIENTE' },
        { text: 'Incompleto', value: 'INCOMPLETO' }
      ],
      onFilter: (value, record) => record.EstadoGeneral === value
    },
    {
      title: 'Progreso',
      dataIndex: 'PorcentajeCompletado',
      key: 'PorcentajeCompletado',
      width: 100,
      align: 'center',
      render: (porcentaje) => `${parseFloat(porcentaje || 0).toFixed(1)}%`,
      sorter: (a, b) => parseFloat(a.PorcentajeCompletado || 0) - parseFloat(b.PorcentajeCompletado || 0)
    },
    {
      title: 'Estudiantes',
      key: 'estudiantes',
      width: 120,
      align: 'center',
      render: (_, record) => `${record.EstudiantesCalificados || 0}/${record.TotalEstudiantes || 0}`
    },
    {
      title: 'Problemas',
      dataIndex: 'Problemas',
      key: 'Problemas',
      render: (problemas) => (
        <div>
          {problemas && problemas.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: '12px' }}>
              {problemas.map((problema, index) => (
                <li key={index} style={{ color: '#ff4d4f' }}>{problema}</li>
              ))}
            </ul>
          ) : (
            <span style={{ color: '#999' }}>-</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <LockOutlined />
            <span>Cierre de Unidades</span>
          </Space>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col span={12}>
              <Space>
                <span style={{ fontWeight: 'bold' }}>Seleccionar Unidad:</span>
                <Select
                  style={{ width: 250 }}
                  value={unidadSeleccionada}
                  onChange={setUnidadSeleccionada}
                  loading={loading}
                  placeholder="Selecciona una unidad"
                >
                  {unidades.map(unidad => (
                    <Option key={unidad.NumeroUnidad} value={unidad.NumeroUnidad}>
                      {unidad.NombreUnidad}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={actualizarEstado}
                loading={loading}
              >
                Refrescar
              </Button>
            </Col>
          </Row>
        </div>

        {loading && !cursosData ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Spin size="large" />
          </div>
        ) : cursosData ? (
          <>
            {/* Cards de Estadísticas */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Total Cursos"
                    value={cursosData.totalCursos}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Listos para Cerrar"
                    value={cursosData.cursosListos}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                    suffix={
                      esAdminOOperador && (
                        <Button
                          type="primary"
                          size="small"
                          danger
                          icon={<LockOutlined />}
                          onClick={cerrarCursosListos}
                          loading={procesando}
                          disabled={cursosData.cursosListos === 0}
                          style={{ marginLeft: 8 }}
                        >
                          Cerrar {cursosData.cursosListos}
                        </Button>
                      )
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Pendientes"
                    value={cursosData.cursosPendientes}
                    valueStyle={{ color: '#faad14' }}
                    prefix={<ClockCircleOutlined />}
                    suffix={
                      <Button
                        type="default"
                        size="small"
                        icon={<BellOutlined />}
                        onClick={notificarPendientes}
                        loading={procesando}
                        disabled={cursosData.cursosPendientes + cursosData.cursosIncompletos === 0}
                        style={{ marginLeft: 8 }}
                      >
                        Notificar
                      </Button>
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Incompletos"
                    value={cursosData.cursosIncompletos}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<CloseCircleOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Tabla de Cursos No Listos */}
            <Card
              title={`Cursos con Pendientes (${cursosData.cursosNoListos.length})`}
              size="small"
            >
              {cursosData.cursosNoListos.length === 0 ? (
                <Empty
                  description="Todos los cursos están listos para cerrar"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Table
                  columns={columnas}
                  dataSource={cursosData.cursosNoListos}
                  rowKey={(record) => `${record.IdCurso}-${record.IdDocente}`}
                  size="small"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total: ${total} cursos`
                  }}
                  scroll={{ x: 1200 }}
                />
              )}
            </Card>
          </>
        ) : (
          <Empty description="Selecciona una unidad para ver los detalles" />
        )}
      </Card>

      {/* Modal de Confirmación para Notificaciones */}
      <Modal
        title="¿Notificar a docentes con pendientes?"
        open={modalNotificarVisible}
        onOk={handleConfirmarNotificacion}
        onCancel={() => setModalNotificarVisible(false)}
        okText="Sí, enviar notificaciones"
        cancelText="Cancelar"
        confirmLoading={procesando}
        width={500}
      >
        <div style={{ marginTop: 16 }}>
          <p><BellOutlined style={{ color: '#1890ff', marginRight: 8 }} />Se enviará una notificación a los docentes de <strong>{cursosData?.cursosPendientes + cursosData?.cursosIncompletos || 0} curso(s)</strong> con pendientes.</p>
          <p>Se asignará automáticamente una <strong>fecha límite de 3 días</strong>.</p>
        </div>
      </Modal>

      {/* Modal de Confirmación para Cerrar Cursos Listos */}
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            ¿Cerrar cursos listos?
          </span>
        }
        open={modalCerrarVisible}
        onOk={handleConfirmarCierre}
        onCancel={() => setModalCerrarVisible(false)}
        okText="Sí, cerrar cursos"
        cancelText="Cancelar"
        confirmLoading={procesando}
        okButtonProps={{ danger: true }}
        width={550}
      >
        <div style={{ marginTop: 16 }}>
          <p>
            <LockOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Se cerrarán <strong>{cursosData?.cursosListos || 0} curso(s)</strong> con estado LISTO.
          </p>
          <p>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            Se abrirá automáticamente la <strong>siguiente unidad</strong> para esos cursos.
          </p>
          <p>
            <ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Los cursos con pendientes <strong>permanecerán abiertos</strong> en la unidad actual.
          </p>
          <p style={{ marginTop: 16, color: '#666', fontSize: '13px' }}>
            Esta acción es permanente y no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CierreUnidades;

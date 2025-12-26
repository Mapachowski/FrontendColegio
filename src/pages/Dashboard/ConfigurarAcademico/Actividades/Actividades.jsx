import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, message, Tag, Card, Row, Col, Select, Tooltip, Badge, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, UnorderedListOutlined, CalendarOutlined, FormOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';
import { getCicloActual } from '../../../../utils/cicloEscolar';
import CrearEditarActividadModal from './components/CrearEditarActividadModal';
import VerActividadModal from './components/VerActividadModal';

const { Option } = Select;

const Actividades = () => {
  const navigate = useNavigate();
  const [asignaciones, setAsignaciones] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);

  // Obtener usuario logueado
  const user = JSON.parse(localStorage.getItem('user')) || { rol: null, IdUsuario: null };
  const esDocente = user.rol === 4;
  const esAlumno = user.rol === 5;

  // Estado para el idDocente del usuario logueado (si es docente)
  const [idDocenteLogueado, setIdDocenteLogueado] = useState(null);

  // Modales
  const [modalCrearEditarVisible, setModalCrearEditarVisible] = useState(false);
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Catálogos para filtros
  const [docentes, setDocentes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Filtros
  const [filtros, setFiltros] = useState({
    anio: getCicloActual(),
    idGrado: null,
    idSeccion: null,
    idJornada: null,
    idDocente: null
  });

  // Filtro de estado de actividades
  const [filtroEstadoActividad, setFiltroEstadoActividad] = useState('activas'); // 'activas', 'inactivas', 'todas'

  useEffect(() => {
    const inicializar = async () => {
      if (esDocente) {
        await obtenerIdDocente();
      } else if (!esAlumno) {
        cargarCatalogos();
        cargarAsignaciones();
      }
    };
    inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!esAlumno) {
      cargarAsignaciones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.anio, filtros.idGrado, filtros.idSeccion, filtros.idJornada, filtros.idDocente]);

  const obtenerIdDocente = async () => {
    try {
      const response = await apiClient.get('/docentes');
      if (response.data.success) {
        const docentes = response.data.data;
        const miDocente = docentes.find(doc => doc.idUsuario === user.IdUsuario);
        if (miDocente) {
          const idDocente = miDocente.idDocente;
          setIdDocenteLogueado(idDocente);
          setFiltros(prev => ({ ...prev, idDocente: idDocente }));
          cargarCatalogos();
        } else {
          message.error('No se encontró el perfil de docente asociado a tu usuario');
        }
      }
    } catch (error) {
      console.error('Error al obtener idDocente:', error);
      message.error('Error al obtener información del docente');
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [docentesRes, gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/docentes'),
        apiClient.get('/grados'),
        apiClient.get('/secciones'),
        apiClient.get('/jornadas')
      ]);

      if (docentesRes.data.success) setDocentes(docentesRes.data.data);
      if (gradosRes.data.success) setGrados(gradosRes.data.data);
      if (Array.isArray(seccionesRes.data)) setSecciones(seccionesRes.data);
      if (Array.isArray(jornadasRes.data)) setJornadas(jornadasRes.data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      message.error('Error al cargar catálogos');
    }
  };

  const cargarAsignaciones = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.anio) params.anio = filtros.anio;
      if (filtros.idGrado) params.idGrado = filtros.idGrado;
      if (filtros.idSeccion) params.idSeccion = filtros.idSeccion;
      if (filtros.idJornada) params.idJornada = filtros.idJornada;
      if (filtros.idDocente) params.idDocente = filtros.idDocente;

      const response = await apiClient.get('/asignaciones', { params });
      let asignacionesData = [];

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          if (data.length > 0 && typeof data[0] === 'object' && !data[0].IdAsignacionDocente) {
            const primerElemento = data[0];
            asignacionesData = Object.keys(primerElemento)
              .filter(key => !isNaN(key))
              .map(key => primerElemento[key])
              .filter(item => item && item.IdAsignacionDocente);
          } else if (data.length > 0 && data[0].IdAsignacionDocente) {
            asignacionesData = data;
          }
        } else if (typeof data === 'object' && data.IdAsignacionDocente) {
          asignacionesData = [data];
        }
      } else if (Array.isArray(response.data)) {
        asignacionesData = response.data;
      }

      setAsignaciones(asignacionesData);
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      message.error('Error al cargar asignaciones');
      setAsignaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarUnidadesAsignacion = async (idAsignacion) => {
    setLoadingUnidades(true);
    try {
      const response = await apiClient.get(`/unidades/asignacion/${idAsignacion}`);
      if (response.data.success) {
        setUnidades(response.data.data || []);
      } else {
        setUnidades([]);
        message.warning('No se encontraron unidades para esta asignación');
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
      message.error('Error al cargar las unidades');
      setUnidades([]);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const cargarActividadesUnidad = async (idUnidad) => {
    setLoadingActividades(true);
    try {
      const response = await apiClient.get(`/actividades/unidad/${idUnidad}`);
      if (response.data.success) {
        setActividades(response.data.data || []);
      } else {
        setActividades([]);
      }
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      message.error('Error al cargar las actividades');
      setActividades([]);
    } finally {
      setLoadingActividades(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    if (esDocente && campo === 'idDocente') return;
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      anio: getCicloActual(),
      idGrado: null,
      idSeccion: null,
      idJornada: null,
      idDocente: esDocente ? idDocenteLogueado : null
    });
  };

  const handleSeleccionarAsignacion = async (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setUnidadSeleccionada(null);
    setActividades([]);
    await cargarUnidadesAsignacion(asignacion.IdAsignacionDocente);
  };

  const handleSeleccionarUnidad = async (unidad) => {
    setUnidadSeleccionada(unidad);
    await cargarActividadesUnidad(unidad.IdUnidad);
  };

  const abrirModalCrear = () => {
    // Validar que la unidad esté activa si es docente
    if (esDocente && unidadSeleccionada && unidadSeleccionada.Activa !== 1) {
      message.warning('Solo puedes crear actividades en la unidad activa');
      return;
    }

    setActividadSeleccionada(null);
    setModoEdicion(false);
    setModalCrearEditarVisible(true);
  };

  const abrirModalEditar = (actividad) => {
    // Validar que la unidad esté activa si es docente
    if (esDocente && unidadSeleccionada && unidadSeleccionada.Activa !== 1) {
      message.warning('Solo puedes editar actividades de la unidad activa');
      return;
    }

    setActividadSeleccionada(actividad);
    setModoEdicion(true);
    setModalCrearEditarVisible(true);
  };

  const abrirModalVer = (actividad) => {
    setActividadSeleccionada(actividad);
    setModalVerVisible(true);
  };

  const irACalificar = (actividad) => {
    navigate('/dashboard/configurar-academico/calificar-actividad', {
      state: {
        actividad,
        unidad: unidadSeleccionada,
        asignacion: asignacionSeleccionada
      }
    });
  };

  const handleEliminarActividad = async (idActividad) => {
    // Validar que la unidad esté activa si es docente
    if (esDocente && unidadSeleccionada && unidadSeleccionada.Activa !== 1) {
      message.warning('Solo puedes eliminar actividades de la unidad activa');
      return;
    }

    try {
      const response = await apiClient.delete(`/actividades/${idActividad}`);
      if (response.data.success) {
        message.success('Actividad eliminada correctamente');
        await cargarActividadesUnidad(unidadSeleccionada.IdUnidad);
      }
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      message.error(error.response?.data?.error || 'Error al eliminar actividad');
    }
  };

  // Filtrar actividades según el estado seleccionado
  const actividadesFiltradas = actividades.filter(actividad => {
    if (filtroEstadoActividad === 'activas') {
      return actividad.Estado === true || actividad.Estado === 1;
    } else if (filtroEstadoActividad === 'inactivas') {
      return actividad.Estado === false || actividad.Estado === 0;
    }
    // 'todas'
    return true;
  });

  const columnasAsignaciones = [
    {
      title: 'Año',
      dataIndex: 'Anio',
      key: 'Anio',
      width: 80,
      render: (anio) => <Tag color="blue">{anio}</Tag>
    },
    {
      title: 'Docente',
      dataIndex: 'NombreDocente',
      key: 'NombreDocente',
      width: 200
    },
    {
      title: 'Curso',
      dataIndex: 'NombreCurso',
      key: 'NombreCurso',
      width: 180
    },
    {
      title: 'Grado',
      dataIndex: 'NombreGrado',
      key: 'NombreGrado',
      width: 150
    },
    {
      title: 'Sección',
      dataIndex: 'NombreSeccion',
      key: 'NombreSeccion',
      width: 100,
      align: 'center'
    },
    {
      title: 'Jornada',
      dataIndex: 'NombreJornada',
      key: 'NombreJornada',
      width: 120
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<UnorderedListOutlined />}
          onClick={() => handleSeleccionarAsignacion(record)}
        >
          Ver Unidades
        </Button>
      )
    }
  ];

  const columnasUnidades = [
    {
      title: 'Unidad',
      dataIndex: 'NumeroUnidad',
      key: 'NumeroUnidad',
      width: 100,
      render: (num, record) => (
        <Space>
          {record.Activa === 1 && <Badge status="processing" />}
          <strong>Unidad {num}</strong>
        </Space>
      )
    },
    {
      title: 'Nombre',
      dataIndex: 'NombreUnidad',
      key: 'NombreUnidad',
      width: 200
    },
    {
      title: 'Punteo Zona',
      dataIndex: 'PunteoZona',
      key: 'PunteoZona',
      width: 120,
      align: 'center',
      render: (val) => <Tag color="blue">{parseFloat(val)} pts</Tag>
    },
    {
      title: 'Punteo Final',
      dataIndex: 'PunteoFinal',
      key: 'PunteoFinal',
      width: 120,
      align: 'center',
      render: (val) => <Tag color="green">{parseFloat(val)} pts</Tag>
    },
    {
      title: 'Estado',
      dataIndex: 'Activa',
      key: 'Activa',
      width: 120,
      align: 'center',
      render: (activa) => (
        activa === 1 ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Activa</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">Cerrada</Tag>
        )
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CalendarOutlined />}
          onClick={() => handleSeleccionarUnidad(record)}
        >
          Ver Actividades
        </Button>
      )
    }
  ];

  const columnasActividades = [
    {
      title: 'Nombre',
      dataIndex: 'NombreActividad',
      key: 'NombreActividad',
      width: 200
    },
    {
      title: 'Descripción',
      dataIndex: 'Descripcion',
      key: 'Descripcion',
      width: 250,
      ellipsis: true
    },
    {
      title: 'Tipo',
      dataIndex: 'TipoActividad',
      key: 'TipoActividad',
      width: 100,
      align: 'center',
      render: (tipo) => (
        <Tag color={tipo === 'zona' ? 'blue' : 'green'}>
          {tipo === 'zona' ? 'Zona' : 'Final'}
        </Tag>
      )
    },
    {
      title: 'Punteo Máximo',
      dataIndex: 'PunteoMaximo',
      key: 'PunteoMaximo',
      width: 120,
      align: 'center',
      render: (val) => <Tag color="orange">{parseFloat(val)} pts</Tag>
    },
    {
      title: 'Fecha',
      dataIndex: 'FechaActividad',
      key: 'FechaActividad',
      width: 120,
      align: 'center',
      render: (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-GT') : '-'
    },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'Estado',
      width: 100,
      align: 'center',
      render: (estado) => (
        estado ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Activa</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">Inactiva</Tag>
        )
      )
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="Calificar actividad">
            <Button
              type="primary"
              size="small"
              icon={<FormOutlined />}
              onClick={() => irACalificar(record)}
              disabled={!record.Estado}
            >
              Calificar
            </Button>
          </Tooltip>
          <Tooltip title="Ver detalles">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => abrirModalVer(record)}
            >
              Ver
            </Button>
          </Tooltip>
          <Tooltip title={esDocente && unidadSeleccionada?.Activa !== 1 ? 'Solo puedes editar actividades de la unidad activa' : 'Editar actividad'}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => abrirModalEditar(record)}
              disabled={esDocente && unidadSeleccionada?.Activa !== 1}
            >
              Editar
            </Button>
          </Tooltip>
          <Popconfirm
            title="¿Eliminar actividad?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleEliminarActividad(record.IdActividad)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            disabled={esDocente && unidadSeleccionada?.Activa !== 1}
          >
            <Tooltip title={esDocente && unidadSeleccionada?.Activa !== 1 ? 'Solo puedes eliminar actividades de la unidad activa' : 'Eliminar actividad'}>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={esDocente && unidadSeleccionada?.Activa !== 1}
              >
                Eliminar
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calcular resumen de punteos (solo actividades activas)
  const calcularResumen = () => {
    if (!actividades.length || !unidadSeleccionada) return null;

    // Solo considerar actividades activas para el resumen
    const actividadesActivas = actividades.filter(a => a.Estado === true || a.Estado === 1);

    const actividadesZona = actividadesActivas.filter(a => a.TipoActividad === 'zona');
    const actividadesFinal = actividadesActivas.filter(a => a.TipoActividad === 'final');

    const sumaZona = actividadesZona.reduce((acc, a) => acc + parseFloat(a.PunteoMaximo || 0), 0);
    const sumaFinal = actividadesFinal.reduce((acc, a) => acc + parseFloat(a.PunteoMaximo || 0), 0);

    const punteoZonaConfig = parseFloat(unidadSeleccionada.PunteoZona);
    const punteoFinalConfig = parseFloat(unidadSeleccionada.PunteoFinal);

    return {
      sumaZona,
      sumaFinal,
      punteoZonaConfig,
      punteoFinalConfig,
      zonaCompleta: sumaZona === punteoZonaConfig,
      finalCompleta: sumaFinal === punteoFinalConfig
    };
  };

  const resumen = calcularResumen();

  return (
    <div style={{ padding: '24px' }}>
      {/* Card de Asignaciones */}
      {!esAlumno && (
        <Card
          title={
            <span>
              <UnorderedListOutlined /> {esDocente ? 'Mis Asignaciones' : 'Seleccione una Asignación'}
            </span>
          }
          style={{ marginBottom: '24px' }}
        >
          {/* Filtros */}
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="Filtrar por año"
                style={{ width: '100%' }}
                value={filtros.anio}
                onChange={(value) => handleFiltroChange('anio', value)}
                allowClear
              >
                <Option value={2024}>2024</Option>
                <Option value={2025}>2025</Option>
                <Option value={2026}>2026</Option>
                <Option value={2027}>2027</Option>
                <Option value={2028}>2028</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={5}>
              <Select
                placeholder="Filtrar por grado"
                style={{ width: '100%' }}
                value={filtros.idGrado}
                onChange={(value) => handleFiltroChange('idGrado', value)}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {grados.map(grado => (
                  <Option key={grado.IdGrado} value={grado.IdGrado}>
                    {grado.NombreGrado}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="Filtrar por sección"
                style={{ width: '100%' }}
                value={filtros.idSeccion}
                onChange={(value) => handleFiltroChange('idSeccion', value)}
                allowClear
              >
                {secciones.map(seccion => (
                  <Option key={seccion.IdSeccion} value={seccion.IdSeccion}>
                    {seccion.NombreSeccion}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="Filtrar por jornada"
                style={{ width: '100%' }}
                value={filtros.idJornada}
                onChange={(value) => handleFiltroChange('idJornada', value)}
                allowClear
              >
                {jornadas.map(jornada => (
                  <Option key={jornada.IdJornada} value={jornada.IdJornada}>
                    {jornada.NombreJornada}
                  </Option>
                ))}
              </Select>
            </Col>
            {!esDocente && (
              <Col xs={24} sm={12} md={6} lg={5}>
                <Select
                  placeholder="Filtrar por docente"
                  style={{ width: '100%' }}
                  value={filtros.idDocente}
                  onChange={(value) => handleFiltroChange('idDocente', value)}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {docentes.map(doc => (
                    <Option key={doc.idDocente} value={doc.idDocente}>
                      {doc.NombreDocente}
                    </Option>
                  ))}
                </Select>
              </Col>
            )}
            <Col xs={24} sm={12} md={6} lg={2}>
              <Button onClick={limpiarFiltros} style={{ width: '100%' }}>
                Limpiar
              </Button>
            </Col>
          </Row>

          <Table
            columns={columnasAsignaciones}
            dataSource={asignaciones}
            rowKey="IdAsignacionDocente"
            loading={loading}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} asignaciones`,
            }}
            bordered
            size="middle"
            scroll={{ x: 1000 }}
          />
        </Card>
      )}

      {/* Card de Unidades */}
      {asignacionSeleccionada && !esAlumno && (
        <Card
          title={
            <span>
              <UnorderedListOutlined /> Unidades de: {asignacionSeleccionada.NombreDocente} - {asignacionSeleccionada.NombreCurso}
            </span>
          }
          style={{ marginBottom: '24px' }}
        >
          <Table
            columns={columnasUnidades}
            dataSource={unidades}
            rowKey="IdUnidad"
            loading={loadingUnidades}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: 800 }}
          />
        </Card>
      )}

      {/* Card de Actividades */}
      {unidadSeleccionada && (
        <Card
          title={
            <span>
              <CalendarOutlined /> Actividades - Unidad {unidadSeleccionada.NumeroUnidad}: {unidadSeleccionada.NombreUnidad}
            </span>
          }
          extra={
            !esAlumno && (
              <Tooltip
                title={
                  esDocente && unidadSeleccionada?.Activa !== 1
                    ? 'Solo puedes crear actividades en la unidad activa'
                    : ''
                }
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={abrirModalCrear}
                  disabled={esDocente && unidadSeleccionada?.Activa !== 1}
                >
                  Nueva Actividad
                </Button>
              </Tooltip>
            )
          }
        >
          {/* Filtro de estado de actividades */}
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <strong>Mostrar:</strong>
            <Select
              value={filtroEstadoActividad}
              onChange={setFiltroEstadoActividad}
              style={{ width: 180 }}
            >
              <Option value="activas">Actividades Activas</Option>
              <Option value="inactivas">Actividades Inactivas</Option>
              <Option value="todas">Todas las Actividades</Option>
            </Select>
            <Tag color="blue">
              {actividadesFiltradas.length} {actividadesFiltradas.length === 1 ? 'actividad' : 'actividades'}
            </Tag>
          </div>

          {/* Resumen de punteos */}
          {resumen && !esAlumno && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f2f5',
              borderRadius: '4px'
            }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Zona:</strong>
                    <Tag color={resumen.zonaCompleta ? 'success' : 'warning'}>
                      {resumen.sumaZona} / {resumen.punteoZonaConfig} pts
                    </Tag>
                    {resumen.zonaCompleta ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#faad14' }} />
                    )}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Final:</strong>
                    <Tag color={resumen.finalCompleta ? 'success' : 'warning'}>
                      {resumen.sumaFinal} / {resumen.punteoFinalConfig} pts
                    </Tag>
                    {resumen.finalCompleta ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#faad14' }} />
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          )}

          <Table
            columns={columnasActividades}
            dataSource={actividadesFiltradas}
            rowKey="IdActividad"
            loading={loadingActividades}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total: ${total} actividades`
            }}
            bordered
            size="middle"
            scroll={{ x: 1000 }}
            locale={{
              emptyText: filtroEstadoActividad === 'activas'
                ? 'No hay actividades activas para esta unidad'
                : filtroEstadoActividad === 'inactivas'
                ? 'No hay actividades inactivas para esta unidad'
                : 'No hay actividades creadas para esta unidad'
            }}
          />
        </Card>
      )}

      {/* Modales */}
      <CrearEditarActividadModal
        visible={modalCrearEditarVisible}
        actividad={actividadSeleccionada}
        unidad={unidadSeleccionada}
        modoEdicion={modoEdicion}
        onCancel={() => {
          setModalCrearEditarVisible(false);
          setActividadSeleccionada(null);
        }}
        onSuccess={async () => {
          setModalCrearEditarVisible(false);
          setActividadSeleccionada(null);
          if (unidadSeleccionada) {
            await cargarActividadesUnidad(unidadSeleccionada.IdUnidad);
          }
        }}
      />

      <VerActividadModal
        visible={modalVerVisible}
        actividad={actividadSeleccionada}
        onCancel={() => {
          setModalVerVisible(false);
          setActividadSeleccionada(null);
        }}
      />
    </div>
  );
};

export default Actividades;

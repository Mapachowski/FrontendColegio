import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Tag, Card, Row, Col, Select, Tooltip, Modal, Badge } from 'antd';
import { UnorderedListOutlined, EyeOutlined, SettingOutlined, SwapOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';
import { getCicloActual } from '../../../../utils/cicloEscolar';
import ConfigurarPunteosModal from './components/ConfigurarPunteosModal';
import VerUnidadModal from './components/VerUnidadModal';

const { Option } = Select;
const { confirm } = Modal;

const Unidades = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(false);

  // Obtener usuario logueado
  const user = JSON.parse(localStorage.getItem('user')) || { rol: null, IdUsuario: null };
  const esDocente = user.rol === 4;

  // Estado para el idDocente del usuario logueado (si es docente)
  const [idDocenteLogueado, setIdDocenteLogueado] = useState(null);

  // Modales
  const [modalConfigPunteosVisible, setModalConfigPunteosVisible] = useState(false);
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);

  // Catálogos para filtros
  const [docentes, setDocentes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Filtros - Si es docente, se asignará el idDocente después de obtenerlo
  const [filtros, setFiltros] = useState({
    anio: getCicloActual(),
    idGrado: null,
    idSeccion: null,
    idJornada: null,
    idDocente: null
  });

  useEffect(() => {
    const inicializar = async () => {
      if (esDocente) {
        await obtenerIdDocente();
      } else {
        cargarCatalogos();
        cargarAsignaciones();
      }
    };
    inicializar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarAsignaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.anio, filtros.idGrado, filtros.idSeccion, filtros.idJornada, filtros.idDocente]);

  const obtenerIdDocente = async () => {
    try {
      // Buscar el docente asociado al usuario logueado
      const response = await apiClient.get('/docentes');

      if (response.data.success) {
        const docentes = response.data.data;
        const miDocente = docentes.find(doc => doc.idUsuario === user.IdUsuario);

        if (miDocente) {
          const idDocente = miDocente.idDocente;
          setIdDocenteLogueado(idDocente);

          // Establecer el filtro de docente automáticamente
          setFiltros(prev => ({
            ...prev,
            idDocente: idDocente
          }));

          // Ahora cargar catálogos y asignaciones
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

      if (docentesRes.data.success) {
        setDocentes(docentesRes.data.data);
      }
      if (gradosRes.data.success) {
        setGrados(gradosRes.data.data);
      }
      if (Array.isArray(seccionesRes.data)) {
        setSecciones(seccionesRes.data);
      }
      if (Array.isArray(jornadasRes.data)) {
        setJornadas(jornadasRes.data);
      }
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

  const handleFiltroChange = (campo, valor) => {
    // Si es docente, NO permitir cambiar el filtro de docente
    if (esDocente && campo === 'idDocente') {
      return;
    }

    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      anio: getCicloActual(),
      idGrado: null,
      idSeccion: null,
      idJornada: null,
      idDocente: esDocente ? idDocenteLogueado : null // Mantener filtro de docente si es docente
    });
  };

  const abrirModalConfigPunteos = (unidad) => {
    setUnidadSeleccionada(unidad);
    setModalConfigPunteosVisible(true);
  };

  const abrirModalVer = (unidad) => {
    setUnidadSeleccionada(unidad);
    setModalVerVisible(true);
  };

  const handleSeleccionarAsignacion = async (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    await cargarUnidadesAsignacion(asignacion.IdAsignacionDocente);
  };

  const handleCerrarYAbrirSiguiente = () => {
    console.log('🔵 handleCerrarYAbrirSiguiente llamado');
    console.log('   Asignación seleccionada:', asignacionSeleccionada);
    console.log('   Unidades:', unidades);

    if (!asignacionSeleccionada) {
      message.warning('Seleccione una asignación primero');
      return;
    }

    const unidadActiva = unidades.find(u => u.Activa === 1);
    console.log('   Unidad activa encontrada:', unidadActiva);

    if (!unidadActiva) {
      message.warning('No hay ninguna unidad activa');
      return;
    }

    confirm({
      title: '¿Cerrar unidad activa y abrir la siguiente?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Se cerrará la <strong>Unidad {unidadActiva.NumeroUnidad}</strong> y se abrirá la siguiente.</p>
          <p style={{ color: '#999', fontSize: '12px', marginTop: 10 }}>
            Asegúrese de haber completado todas las actividades y calificaciones de la unidad actual.
          </p>
        </div>
      ),
      okText: 'Sí, continuar',
      cancelText: 'Cancelar',
      onOk: async () => {
        console.log('🟢 Confirmación aceptada - Cerrando y abriendo siguiente');
        try {
          const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
          const response = await apiClient.post(
            `/unidades/asignacion/${asignacionSeleccionada.IdAsignacionDocente}/cerrar-y-abrir`,
            { ModificadoPor: String(user.IdUsuario) }
          );

          if (response.data.success) {
            message.success(response.data.message);
            await cargarUnidadesAsignacion(asignacionSeleccionada.IdAsignacionDocente);
          }
        } catch (error) {
          console.error('❌ Error al cerrar y abrir unidad:', error);
          message.error(error.response?.data?.error || 'Error al cerrar y abrir unidad');
        }
      }
    });
  };

  const handleActivarUnidad = (unidad) => {
    console.log('🔵 handleActivarUnidad llamado - Unidad:', unidad);

    confirm({
      title: '¿Activar esta unidad?',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Se activará la <strong>Unidad {unidad.NumeroUnidad}</strong> y se cerrará la unidad actualmente activa.</p>
          <p style={{ color: '#ff9800', fontSize: '12px', marginTop: 10 }}>
            Use esta opción solo si necesita cambiar manualmente de unidad.
          </p>
        </div>
      ),
      okText: 'Sí, activar',
      cancelText: 'Cancelar',
      onOk: async () => {
        console.log('🟢 Confirmación aceptada - Activando unidad:', unidad.IdUnidad);
        try {
          const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
          const response = await apiClient.put(
            `/unidades/${unidad.IdUnidad}/activar`,
            { ModificadoPor: String(user.IdUsuario) }
          );

          if (response.data.success) {
            message.success(response.data.message);
            await cargarUnidadesAsignacion(asignacionSeleccionada.IdAsignacionDocente);
          }
        } catch (error) {
          console.error('❌ Error al activar unidad:', error);
          message.error(error.response?.data?.error || 'Error al activar unidad');
        }
      }
    });
  };

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
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
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
          <Tooltip title="Configurar punteos">
            <Button
              type="link"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => abrirModalConfigPunteos(record)}
            >
              Configurar
            </Button>
          </Tooltip>
          {/* Solo Admin (1) y Operador (2) pueden activar unidades manualmente */}
          {!esDocente && record.Activa === 0 && (
            <Tooltip title="Activar esta unidad">
              <Button
                type="link"
                size="small"
                icon={<SwapOutlined />}
                onClick={() => handleActivarUnidad(record)}
              >
                Activar
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Card de Asignaciones */}
      <Card
        title={
          <span>
            <UnorderedListOutlined /> {esDocente ? 'Mis Asignaciones - Seleccione una para Ver sus Unidades' : 'Seleccione una Asignación para Ver sus Unidades'}
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
          {/* Solo mostrar filtro de docente si NO es docente (admin u operador) */}
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

      {/* Card de Unidades */}
      {asignacionSeleccionada && (
        <Card
          title={
            <span>
              <UnorderedListOutlined /> Unidades de: {asignacionSeleccionada.NombreDocente} - {asignacionSeleccionada.NombreCurso} ({asignacionSeleccionada.NombreGrado} {asignacionSeleccionada.NombreSeccion})
            </span>
          }
          extra={
            // Solo Admin (1) y Operador (2) pueden cerrar/abrir unidades manualmente
            !esDocente && (
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={handleCerrarYAbrirSiguiente}
                disabled={!unidades.find(u => u.Activa === 1) || unidades.find(u => u.Activa === 1)?.NumeroUnidad === 4}
              >
                Cerrar Unidad Activa y Abrir Siguiente
              </Button>
            )
          }
        >
          {/* Mensaje informativo para docentes */}
          {esDocente && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '4px'
            }}>
              <p style={{ margin: 0, color: '#0050b3' }}>
                <strong>Nota:</strong> Los cambios de unidad se realizan automáticamente según el calendario académico.
                Puedes visualizar y configurar los punteos de zona y examen final, pero no activar/desactivar unidades manualmente.
              </p>
            </div>
          )}

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

      {/* Modales */}
      <ConfigurarPunteosModal
        visible={modalConfigPunteosVisible}
        unidad={unidadSeleccionada}
        onCancel={() => {
          setModalConfigPunteosVisible(false);
          setUnidadSeleccionada(null);
        }}
        onSuccess={async () => {
          setModalConfigPunteosVisible(false);
          setUnidadSeleccionada(null);
          if (asignacionSeleccionada) {
            await cargarUnidadesAsignacion(asignacionSeleccionada.IdAsignacionDocente);
          }
        }}
      />

      <VerUnidadModal
        visible={modalVerVisible}
        unidad={unidadSeleccionada}
        onCancel={() => {
          setModalVerVisible(false);
          setUnidadSeleccionada(null);
        }}
      />
    </div>
  );
};

export default Unidades;

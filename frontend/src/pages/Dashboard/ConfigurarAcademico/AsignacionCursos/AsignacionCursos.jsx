import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Tag, Card, Row, Col, Select, Tooltip, Modal } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, SwapOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../../api/apiClient';
import { getCicloActual } from '../../../../utils/cicloEscolar';
import CrearAsignacionModal from './components/CrearAsignacionModal';
import EditarAsignacionModal from './components/EditarAsignacionModal';
import VerAsignacionModal from './components/VerAsignacionModal';

const { Option } = Select;

const AsignacionCursos = () => {
  const navigate = useNavigate();
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modales
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);

  // Catálogos para filtros
  const [docentes, setDocentes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Filtros
  const [filtros, setFiltros] = useState({
    anio: getCicloActual(), // Año escolar actual por defecto usando la utilidad
    idGrado: null,
    idSeccion: null,
    idJornada: null,
    idDocente: null
  });

  useEffect(() => {
    cargarCatalogos();
    cargarAsignaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarAsignaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.anio, filtros.idGrado, filtros.idSeccion, filtros.idJornada, filtros.idDocente]);

  const cargarCatalogos = async () => {
    try {
      const [docentesRes, gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/docentes'),
        apiClient.get('/grados'),
        apiClient.get('/secciones'),
        apiClient.get('/jornadas')
      ]);

      // Todos los endpoints vienen con {success, data}
      if (docentesRes.data.success) {
        setDocentes(docentesRes.data.data);
      }
      if (gradosRes.data.success) {
        setGrados(gradosRes.data.data);
      }

      // Secciones y Jornadas también vienen con {success, data}
      if (seccionesRes.data.success || seccionesRes.data.data) {
        setSecciones(seccionesRes.data.data || []);
      }
      if (jornadasRes.data.success || jornadasRes.data.data) {
        setJornadas(jornadasRes.data.data || []);
      }

      console.log('=== CATÁLOGOS CARGADOS ===');
      console.log('Secciones:', seccionesRes.data);
      console.log('Jornadas:', jornadasRes.data);
      console.log('========================');
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      message.error('Error al cargar catálogos');
    }
  };

  const cargarAsignaciones = async () => {
    setLoading(true);
    try {
      // Construir params con filtros activos
      const params = {};
      if (filtros.anio) params.anio = filtros.anio;
      if (filtros.idGrado) params.idGrado = filtros.idGrado;
      if (filtros.idSeccion) params.idSeccion = filtros.idSeccion;
      if (filtros.idJornada) params.idJornada = filtros.idJornada;
      if (filtros.idDocente) params.idDocente = filtros.idDocente;

      const response = await apiClient.get('/asignaciones', { params });

      console.log('=== DEBUG ASIGNACIONES ===');
      console.log('1. Response completo:', response);
      console.log('2. Response.data:', response.data);
      console.log('3. Response.data.success:', response.data.success);
      console.log('4. Response.data.data:', response.data.data);
      console.log('5. Es Array?', Array.isArray(response.data.data));
      console.log('6. Tipo de data:', typeof response.data.data);
      console.log('7. Params enviados:', params);

      // Manejar diferentes estructuras de respuesta
      let asignacionesData = [];

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Si data es un array
        if (Array.isArray(data)) {
          // Verificar si el primer elemento es un objeto con claves numéricas (estructura con filtros)
          if (data.length > 0 && typeof data[0] === 'object' && !data[0].IdAsignacionDocente) {
            // Convertir objeto con claves numéricas a array
            const primerElemento = data[0];
            asignacionesData = Object.keys(primerElemento)
              .filter(key => !isNaN(key)) // Solo claves numéricas
              .map(key => primerElemento[key])
              .filter(item => item && item.IdAsignacionDocente); // Filtrar items válidos
            console.log('✅ Convertido de objeto con claves numéricas a array con', asignacionesData.length, 'elementos');
          }
          // Si es un array normal de asignaciones
          else if (data.length > 0 && data[0].IdAsignacionDocente) {
            asignacionesData = data;
            console.log('✅ Es un array con', data.length, 'elementos');
          }
        }
        // Si data es un objeto único, convertirlo en array
        else if (typeof data === 'object' && data.IdAsignacionDocente) {
          asignacionesData = [data];
          console.log('⚠️ API devolvió un objeto único, convertido a array');
        }
      } else if (Array.isArray(response.data)) {
        asignacionesData = response.data;
        console.log('✅ Response.data es array directo');
      }

      console.log('8. Asignaciones finales a mostrar:', asignacionesData);
      console.log('9. Cantidad de asignaciones:', asignacionesData.length);
      console.log('=========================');

      setAsignaciones(asignacionesData);
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      message.error('Error al cargar asignaciones');
      setAsignaciones([]); // Asegurar que sea array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      anio: null,
      idGrado: null,
      idSeccion: null,
      idJornada: null,
      idDocente: null
    });
  };

  const abrirModalCrear = () => {
    setModalCrearVisible(true);
  };

  const abrirModalEditar = (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setModalEditarVisible(true);
  };

  const abrirModalVer = (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setModalVerVisible(true);
  };

  const handleEliminar = (asignacion) => {
    const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
    const IdColaborador = user.IdUsuario;

    Modal.confirm({
      title: '¿Está seguro de eliminar esta asignación?',
      content: (
        <div>
          <p><strong>Docente:</strong> {asignacion.NombreDocente}</p>
          <p><strong>Curso:</strong> {asignacion.NombreCurso}</p>
          <p><strong>Grado:</strong> {asignacion.NombreGrado} - Sección {asignacion.NombreSeccion}</p>
          <p style={{ color: 'red', marginTop: 10 }}>
            <strong>Advertencia:</strong> Esta acción también desactivará todas las unidades y actividades asociadas.
          </p>
        </div>
      ),
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          const response = await apiClient.delete(`/asignaciones/${asignacion.IdAsignacionDocente}`, {
            data: { ModificadoPor: String(IdColaborador) }
          });

          if (response.data.success) {
            message.success('Asignación eliminada exitosamente');
            cargarAsignaciones();
          }
        } catch (error) {
          console.error('Error al eliminar asignación:', error);
          message.error(error.response?.data?.message || 'Error al eliminar asignación');
        }
      }
    });
  };

  const columns = [
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
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver detalles y unidades">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => abrirModalVer(record)}
            >
              Ver
            </Button>
          </Tooltip>
          <Tooltip title="Cambiar docente">
            <Button
              type="link"
              icon={<SwapOutlined />}
              onClick={() => abrirModalEditar(record)}
            >
              Editar
            </Button>
          </Tooltip>
          <Tooltip title="Eliminar asignación">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleEliminar(record)}
            >
              Eliminar
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <SwapOutlined /> Asignaciones de Docentes a Cursos
          </span>
        }
        extra={
          <Space>
            <Button
              icon={<TeamOutlined />}
              onClick={() => navigate('/dashboard/configurar-academico/asignacion-masiva')}
            >
              Asignación por Mayor
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={abrirModalCrear}
            >
              Nueva Asignación
            </Button>
          </Space>
        }
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
          <Col xs={24} sm={12} md={6} lg={2}>
            <Button onClick={limpiarFiltros} style={{ width: '100%' }}>
              Limpiar
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={asignaciones}
          rowKey="IdAsignacionDocente"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} asignaciones`,
          }}
          bordered
          size="middle"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modales */}
      <CrearAsignacionModal
        visible={modalCrearVisible}
        onCancel={() => setModalCrearVisible(false)}
        onSuccess={() => {
          setModalCrearVisible(false);
          cargarAsignaciones();
        }}
      />

      <EditarAsignacionModal
        visible={modalEditarVisible}
        asignacion={asignacionSeleccionada}
        onCancel={() => {
          setModalEditarVisible(false);
          setAsignacionSeleccionada(null);
        }}
        onSuccess={() => {
          setModalEditarVisible(false);
          setAsignacionSeleccionada(null);
          cargarAsignaciones();
        }}
      />

      <VerAsignacionModal
        visible={modalVerVisible}
        asignacion={asignacionSeleccionada}
        onCancel={() => {
          setModalVerVisible(false);
          setAsignacionSeleccionada(null);
        }}
      />
    </div>
  );
};

export default AsignacionCursos;

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Table, message, Space, Tag, Tooltip } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../../api/apiClient';
import { getCicloActual } from '../../../../utils/cicloEscolar';

const { Option } = Select;

const AsignacionMasiva = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creandoAsignaciones, setCreandoAsignaciones] = useState(false);

  // Catálogos
  const [docentes, setDocentes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Filtros
  const [filtros, setFiltros] = useState({
    anio: getCicloActual(),
    idGrado: null,
    idSeccion: null,
    idJornada: null
  });

  // Cursos del grado con asignaciones
  const [cursos, setCursos] = useState([]);
  const [cursosModificados, setCursosModificados] = useState({}); // { idCurso: idDocente }

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (filtros.idGrado && filtros.idSeccion && filtros.idJornada && filtros.anio) {
      cargarCursosPorGrado();
    } else {
      setCursos([]);
    }
  }, [filtros]);

  const cargarCatalogos = async () => {
    try {
      console.log('=== CARGANDO CATALOGOS ===');
      const [docentesRes, gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/docentes'),
        apiClient.get('/grados'),
        apiClient.get('/secciones'),
        apiClient.get('/jornadas')
      ]);

      console.log('Docentes response:', docentesRes.data);
      console.log('Grados response:', gradosRes.data);
      console.log('Secciones response:', seccionesRes.data);
      console.log('Jornadas response:', jornadasRes.data);

      // Manejar respuestas con estructura {success, data}
      if (docentesRes.data.success) {
        setDocentes(docentesRes.data.data);
      }
      if (gradosRes.data.success) {
        setGrados(gradosRes.data.data);
      }

      // Manejar respuestas que son arrays directos
      if (Array.isArray(seccionesRes.data)) {
        setSecciones(seccionesRes.data);
      }
      if (Array.isArray(jornadasRes.data)) {
        setJornadas(jornadasRes.data);
      }

      console.log('=========================');
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      message.error('Error al cargar catálogos');
    }
  };

  const cargarCursosPorGrado = async () => {
    setLoading(true);
    try {
      const params = {
        idGrado: filtros.idGrado,
        idSeccion: filtros.idSeccion,
        idJornada: filtros.idJornada,
        anio: filtros.anio
      };

      console.log('=== CARGANDO CURSOS POR GRADO ===');
      console.log('Params:', params);

      const response = await apiClient.get('/cursos/por-grado', { params });

      console.log('Response completa:', response.data);

      let cursosData = [];

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Manejar estructura con claves numéricas
        if (Array.isArray(data) && data.length > 0) {
          const primerElemento = data[0];

          if (typeof primerElemento === 'object' && !primerElemento.idCurso) {
            // Es un objeto con claves numéricas
            cursosData = Object.keys(primerElemento)
              .filter(key => !isNaN(key))
              .map(key => primerElemento[key])
              .filter(item => item && item.idCurso);

            console.log('✅ Convertido de objeto con claves numéricas a array');
          } else if (primerElemento.idCurso) {
            // Es un array normal
            cursosData = data;
            console.log('✅ Es un array normal');
          }
        }
      }

      console.log('Cursos procesados:', cursosData);
      console.log('Total cursos:', cursosData.length);
      console.log('================================');

      setCursos(cursosData);
      setCursosModificados({}); // Limpiar selecciones previas
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      message.error('Error al cargar cursos del grado');
    } finally {
      setLoading(false);
    }
  };

  const handleDocenteChange = (idCurso, idDocente) => {
    console.log(`Cambio en curso ${idCurso}: Docente ${idDocente}`);
    setCursosModificados(prev => ({
      ...prev,
      [idCurso]: idDocente
    }));
  };

  const handleCrearAsignaciones = async () => {
    const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
    const IdColaborador = user.IdUsuario;

    // Filtrar solo cursos sin asignar que tengan docente seleccionado
    const asignacionesPorCrear = cursos.filter(curso => {
      const tieneDocenteSeleccionado = cursosModificados[curso.idCurso];
      const noEstaAsignado = curso.YaAsignado === 0;
      return tieneDocenteSeleccionado && noEstaAsignado;
    });

    console.log('=== CREAR ASIGNACIONES MASIVAS ===');
    console.log('Cursos modificados:', cursosModificados);
    console.log('Asignaciones por crear:', asignacionesPorCrear);

    if (asignacionesPorCrear.length === 0) {
      message.warning('No hay nuevas asignaciones para crear. Seleccione docentes para los cursos sin asignar.');
      return;
    }

    setCreandoAsignaciones(true);
    let exitosas = 0;
    let fallidas = 0;
    const errores = [];

    try {
      for (const curso of asignacionesPorCrear) {
        const payload = {
          idDocente: cursosModificados[curso.idCurso],
          idCurso: curso.idCurso,
          idGrado: filtros.idGrado,
          idSeccion: filtros.idSeccion,
          idJornada: filtros.idJornada,
          anio: filtros.anio,
          CreadoPor: String(IdColaborador)
        };

        console.log('Creando asignación:', payload);

        try {
          const response = await apiClient.post('/asignaciones', payload);

          if (response.data.success) {
            exitosas++;
            console.log(`✅ Asignación creada para curso ${curso.Curso}`);
          } else {
            fallidas++;
            errores.push(`${curso.Curso}: ${response.data.message}`);
            console.error(`❌ Error en curso ${curso.Curso}:`, response.data.message);
          }
        } catch (error) {
          fallidas++;
          const mensajeError = error.response?.data?.message || 'Error desconocido';
          errores.push(`${curso.Curso}: ${mensajeError}`);
          console.error(`❌ Error en curso ${curso.Curso}:`, error);
        }
      }

      console.log('=== RESUMEN ===');
      console.log('Exitosas:', exitosas);
      console.log('Fallidas:', fallidas);
      console.log('Errores:', errores);
      console.log('===============');

      // Mostrar resumen
      if (exitosas > 0 && fallidas === 0) {
        message.success(`${exitosas} asignación(es) creada(s) exitosamente`);
        cargarCursosPorGrado(); // Recargar tabla
      } else if (exitosas > 0 && fallidas > 0) {
        message.warning(`${exitosas} exitosas, ${fallidas} fallidas. Revise la consola para detalles.`);
        cargarCursosPorGrado();
      } else {
        message.error('No se pudo crear ninguna asignación. Revise la consola para detalles.');
      }

      if (errores.length > 0) {
        console.error('Errores detallados:', errores);
      }
    } catch (error) {
      console.error('Error general en creación masiva:', error);
      message.error('Error al crear asignaciones');
    } finally {
      setCreandoAsignaciones(false);
    }
  };

  const columns = [
    {
      title: 'Orden',
      dataIndex: 'NoOrden',
      key: 'NoOrden',
      width: 80,
      align: 'center'
    },
    {
      title: 'Curso',
      dataIndex: 'Curso',
      key: 'Curso',
      width: 300,
      render: (text, record) => (
        <Space>
          {text}
          {record.YaAsignado === 1 && (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Asignado
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Docente Actual',
      dataIndex: 'NombreDocente',
      key: 'NombreDocente',
      width: 200,
      render: (text, record) => {
        if (record.YaAsignado === 1) {
          return <Tag color="green">{text}</Tag>;
        }
        return <span style={{ color: '#999' }}>Sin asignar</span>;
      }
    },
    {
      title: (
        <Space>
          Asignar Docente
          <Tooltip title="Solo se crearán asignaciones para cursos sin asignar que tengan un docente seleccionado">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      key: 'accion',
      width: 250,
      render: (_, record) => {
        if (record.YaAsignado === 1) {
          return (
            <Tooltip title="Este curso ya tiene docente asignado. Use 'Editar' en la tabla principal para cambiarlo.">
              <Select
                disabled
                placeholder="Ya asignado"
                style={{ width: '100%' }}
                value={record.IdDocente}
              >
                <Option value={record.IdDocente}>{record.NombreDocente}</Option>
              </Select>
            </Tooltip>
          );
        }

        return (
          <Select
            placeholder="Seleccione docente"
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
            value={cursosModificados[record.idCurso]}
            onChange={(value) => handleDocenteChange(record.idCurso, value)}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {docentes.map(doc => (
              <Option key={doc.idDocente} value={doc.idDocente}>
                {doc.NombreDocente}
              </Option>
            ))}
          </Select>
        );
      }
    }
  ];

  const cursosSeleccionados = Object.keys(cursosModificados).length;
  const cursosSinAsignar = cursos.filter(c => c.YaAsignado === 0).length;
  const cursosYaAsignados = cursos.filter(c => c.YaAsignado === 1).length;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Asignación Masiva de Docentes</h2>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/configurar-academico/asignacion-cursos')}
            >
              Volver a Asignaciones
            </Button>
          </div>

          {/* Filtros */}
          <Card size="small" title="Filtros de Búsqueda">
            <Row gutter={16}>
              <Col span={6}>
                <label>Año Escolar:</label>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  value={filtros.anio}
                  onChange={(value) => setFiltros({ ...filtros, anio: value })}
                >
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </Col>

              <Col span={6}>
                <label>Grado:</label>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Seleccione grado"
                  value={filtros.idGrado}
                  onChange={(value) => setFiltros({ ...filtros, idGrado: value })}
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

              <Col span={6}>
                <label>Sección:</label>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Seleccione sección"
                  value={filtros.idSeccion}
                  onChange={(value) => setFiltros({ ...filtros, idSeccion: value })}
                >
                  {secciones.map(seccion => (
                    <Option key={seccion.IdSeccion} value={seccion.IdSeccion}>
                      {seccion.NombreSeccion}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col span={6}>
                <label>Jornada:</label>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Seleccione jornada"
                  value={filtros.idJornada}
                  onChange={(value) => setFiltros({ ...filtros, idJornada: value })}
                >
                  {jornadas.map(jornada => (
                    <Option key={jornada.IdJornada} value={jornada.IdJornada}>
                      {jornada.NombreJornada}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>

          {/* Estadísticas */}
          {cursos.length > 0 && (
            <Card size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {cursosYaAsignados}
                    </div>
                    <div style={{ color: '#999' }}>Cursos ya asignados</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                      {cursosSinAsignar}
                    </div>
                    <div style={{ color: '#999' }}>Cursos sin asignar</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {cursosSeleccionados}
                    </div>
                    <div style={{ color: '#999' }}>Docentes seleccionados</div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Tabla */}
          <Table
            columns={columns}
            dataSource={cursos}
            rowKey="idCurso"
            loading={loading}
            pagination={false}
            locale={{ emptyText: 'Seleccione filtros para ver los cursos del grado' }}
            rowClassName={(record) => record.YaAsignado === 1 ? 'row-asignado' : ''}
          />

          {/* Botón de acción */}
          {cursos.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={handleCrearAsignaciones}
                loading={creandoAsignaciones}
                disabled={cursosSeleccionados === 0}
              >
                Crear Asignaciones ({cursosSeleccionados})
              </Button>
            </div>
          )}
        </Space>
      </Card>

      <style jsx>{`
        .row-asignado {
          background-color: #f6ffed !important;
        }
      `}</style>
    </div>
  );
};

export default AsignacionMasiva;

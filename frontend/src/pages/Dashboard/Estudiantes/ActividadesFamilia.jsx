import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Typography, Space, Tag, Modal, Tabs, Tooltip, Empty } from 'antd';
import { BookOutlined, FileTextOutlined, TrophyOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { getCicloActual } from '../../../utils/cicloEscolar';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ActividadesFamilia = () => {
  const [hijos, setHijos] = useState([]);
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Cargar hijos al montar el componente
  useEffect(() => {
    cargarHijos();
  }, []);

  // Cargar cursos cuando se selecciona un hijo
  useEffect(() => {
    if (hijoSeleccionado) {
      cargarCursos();
    }
  }, [hijoSeleccionado]);

  const cargarHijos = async () => {
    setLoading(true);
    try {
      // Obtener el perfil del usuario para obtener IdFamilia
      const perfilResponse = await apiClient.get('/login/perfil');
      const IdFamilia = perfilResponse.data.data.IdFamilia;

      if (!IdFamilia) {
        message.error('No se pudo obtener la información de la familia');
        return;
      }

      // Obtener hijos de la familia
      const cicloActual = getCicloActual();
      const response = await apiClient.get(`/familias/hijosporfamilia/${IdFamilia}`, {
        params: { cicloEscolar: cicloActual }
      });

      if (response.data.success) {
        setHijos(response.data.data || []);
        if (response.data.data.length === 0) {
          message.info('No se encontraron hijos inscritos en el ciclo actual');
        }
      } else {
        message.error('Error al cargar los hijos');
      }
    } catch (error) {
      console.error('Error al cargar hijos:', error);
      message.error('Error al cargar la información de los hijos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCursos = async () => {
    if (!hijoSeleccionado) return;

    setLoadingCursos(true);
    try {
      const { IdAlumno, CicloEscolar, IdGrado, IdSeccion, IdJornada } = hijoSeleccionado;

      const response = await apiClient.get(`/familias/hijo/${IdAlumno}/cursos-detallados`, {
        params: {
          cicloEscolar: CicloEscolar,
          idGrado: IdGrado,
          idSeccion: IdSeccion,
          idJornada: IdJornada
        }
      });

      console.log('=== RESPUESTA CURSOS ===');
      console.log('Response completa:', response.data);

      if (response.data.success) {
        const cursosData = response.data.data.cursos || [];
        console.log('📚 Cursos recibidos:', cursosData);
        console.log('📚 Cantidad de cursos:', cursosData.length);

        // Log detallado de cada curso
        cursosData.forEach((curso, index) => {
          console.log(`Curso ${index + 1}:`, {
            IdCurso: curso.IdCurso,
            NombreCurso: curso.NombreCurso,
            Nombre: curso.Nombre,
            nombreCurso: curso.nombreCurso,
            keys: Object.keys(curso)
          });
        });

        setCursos(cursosData);
        if (cursosData.length === 0) {
          message.info('No se encontraron cursos para este estudiante');
        }
      } else {
        message.error('Error al cargar los cursos');
      }
      console.log('=== FIN RESPUESTA CURSOS ===');
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      message.error('Error al cargar los cursos del estudiante');
    } finally {
      setLoadingCursos(false);
    }
  };

  const abrirModalActividades = (curso) => {
    setCursoSeleccionado(curso);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setCursoSeleccionado(null);
  };

  // Columnas para la tabla de hijos
  const columnasHijos = [
    {
      title: 'Carnet',
      dataIndex: 'IdAlumno',
      key: 'IdAlumno',
      width: 100,
    },
    {
      title: 'Nombre Completo',
      key: 'nombreCompleto',
      render: (_, record) => `${record.Nombres} ${record.Apellidos}`,
    },
    {
      title: 'Grado',
      dataIndex: 'NombreGrado',
      key: 'NombreGrado',
    },
    {
      title: 'Sección',
      dataIndex: 'NombreSeccion',
      key: 'NombreSeccion',
      width: 100,
      align: 'center',
    },
    {
      title: 'Jornada',
      dataIndex: 'NombreJornada',
      key: 'NombreJornada',
      width: 120,
    },
    {
      title: 'Acción',
      key: 'accion',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<BookOutlined />}
          onClick={() => setHijoSeleccionado(record)}
          disabled={hijoSeleccionado?.IdAlumno === record.IdAlumno}
        >
          {hijoSeleccionado?.IdAlumno === record.IdAlumno ? 'Seleccionado' : 'Ver Cursos'}
        </Button>
      ),
    },
  ];

  // Renderizar actividades de una unidad
  const renderActividadesUnidad = (actividades) => {
    if (!actividades || actividades.length === 0) {
      return <Empty description="No hay actividades en esta unidad" />;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {actividades.map((actividad) => (
          <Card
            key={actividad.IdActividad}
            size="small"
            style={{
              backgroundColor: '#fafafa',
              borderLeft: actividad.TipoActividad === 'final' ? '4px solid #f44336' : '4px solid #4caf50'
            }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: 16 }}>{actividad.NombreActividad}</Text>
                <Tag color={actividad.TipoActividad === 'final' ? 'red' : 'green'}>
                  {actividad.TipoActividad === 'zona' ? 'Zona' : 'Final'}
                </Tag>
              </div>

              {actividad.Descripcion && (
                <Tooltip title={actividad.Descripcion} placement="topLeft">
                  <Text type="secondary" ellipsis style={{ cursor: 'help' }}>
                    📝 {actividad.Descripcion}
                  </Text>
                </Tooltip>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                padding: 12,
                backgroundColor: 'white',
                borderRadius: 8
              }}>
                <div>
                  <Text type="secondary">Punteo Máximo:</Text>
                  <br />
                  <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                    {parseFloat(actividad.PunteoMaximo).toFixed(2)}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Punteo Obtenido:</Text>
                  <br />
                  {actividad.PunteoObtenido !== null ? (
                    <Text strong style={{
                      fontSize: 18,
                      color: parseFloat(actividad.PunteoObtenido) >= parseFloat(actividad.PunteoMaximo) * 0.6 ? '#52c41a' : '#ff4d4f'
                    }}>
                      {parseFloat(actividad.PunteoObtenido).toFixed(2)}
                    </Text>
                  ) : (
                    <Tag color="orange">Sin calificar</Tag>
                  )}
                </div>
              </div>

              {actividad.Observaciones && (
                <div style={{ padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                  <Text type="secondary">💬 Observaciones: </Text>
                  <Text>{actividad.Observaciones}</Text>
                </div>
              )}

              <Text type="secondary" style={{ fontSize: 12 }}>
                📅 Fecha: {moment(actividad.FechaActividad).format('DD/MM/YYYY')}
              </Text>
            </Space>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Actividades por Curso</Title>
      <Text type="secondary">Consulta las actividades y calificaciones de tus hijos por curso y unidad</Text>

      {/* Tabla de Hijos */}
      <Card
        title="Mis Hijos"
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <Table
          columns={columnasHijos}
          dataSource={hijos}
          rowKey="IdAlumno"
          pagination={false}
          bordered
          locale={{ emptyText: 'No hay hijos inscritos en el ciclo actual' }}
        />
      </Card>

      {/* Cards de Cursos */}
      {hijoSeleccionado && (
        <Card
          title={
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 18 }}>
                Cursos de {hijoSeleccionado.Nombres} {hijoSeleccionado.Apellidos}
              </Text>
              <Space size="large" style={{ marginTop: 8 }}>
                <Text type="secondary">Grado: {hijoSeleccionado.NombreGrado}</Text>
                <Text type="secondary">Sección: {hijoSeleccionado.NombreSeccion}</Text>
                <Text type="secondary">Ciclo: {hijoSeleccionado.CicloEscolar}</Text>
              </Space>
            </Space>
          }
          style={{ marginTop: 24 }}
          loading={loadingCursos}
        >
          {cursos.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 16
            }}>
              {cursos.map((curso) => (
                <Card
                  key={curso.IdCurso}
                  hoverable
                  onClick={() => abrirModalActividades(curso)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textAlign: 'center',
                    cursor: 'pointer',
                    minHeight: 150,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <BookOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                  <Title level={4} style={{ color: 'white', margin: '8px 0' }}>
                    {curso.Curso || curso.NombreCurso}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8, fontSize: 13 }}>
                    Clic para ver actividades →
                  </Text>
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="No se encontraron cursos para este estudiante" />
          )}
        </Card>
      )}

      {/* Modal de Actividades */}
      <Modal
        title={
          <Space>
            <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Text strong style={{ fontSize: 20 }}>
              {cursoSeleccionado?.Curso || cursoSeleccionado?.NombreCurso}
            </Text>
          </Space>
        }
        open={modalVisible}
        onCancel={cerrarModal}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {cursoSeleccionado && (
          <Tabs defaultActiveKey="1" type="card">
            {[1, 2, 3, 4].map((numeroUnidad) => {
              const unidad = cursoSeleccionado.unidades.find(u => u.NumeroUnidad === numeroUnidad);

              return (
                <TabPane
                  tab={
                    <Space>
                      <TrophyOutlined />
                      Unidad {numeroUnidad}
                      {unidad && (
                        <Tag color="blue">{unidad.actividades.length}</Tag>
                      )}
                    </Space>
                  }
                  key={numeroUnidad.toString()}
                  disabled={!unidad}
                >
                  {unidad ? (
                    <div>
                      <Card
                        size="small"
                        style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Text strong style={{ fontSize: 16 }}>
                            {unidad.NombreUnidad}
                          </Text>
                          <Space size="large">
                            <Text>
                              <Text type="secondary">Punteo Zona:</Text> <Text strong>{unidad.PunteoZona}</Text>
                            </Text>
                            <Text>
                              <Text type="secondary">Punteo Final:</Text> <Text strong>{unidad.PunteoFinal}</Text>
                            </Text>
                          </Space>
                        </Space>
                      </Card>

                      {renderActividadesUnidad(unidad.actividades)}
                    </div>
                  ) : (
                    <Empty description="Esta unidad no está disponible" />
                  )}
                </TabPane>
              );
            })}
          </Tabs>
        )}
      </Modal>
    </div>
  );
};

export default ActividadesFamilia;

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Table, InputNumber, Input, Button, message, Statistic, Row, Col,
  Space, Tag, Progress, Spin, Alert
} from 'antd';
import {
  SaveOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TrophyOutlined, BarChartOutlined, WarningOutlined
} from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';
import dayjs from 'dayjs';

const { TextArea } = Input;

const CalificarActividad = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { actividad, unidad, asignacion } = location.state || {};

  const volverAActividades = () => {
    // Guardar contexto en sessionStorage para restaurarlo
    sessionStorage.setItem('contextoActividades', JSON.stringify({
      asignacionSeleccionada: asignacion,
      unidadSeleccionada: unidad
    }));

    // Navegar de vuelta
    navigate('/dashboard/configurar-academico/actividades');
  };

  const [alumnos, setAlumnos] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [zonasCompletas, setZonasCompletas] = useState(true);
  const [notasZonaPorAlumno, setNotasZonaPorAlumno] = useState({}); // { IdAlumno: notaZonaTotal }

  useEffect(() => {
    if (!actividad) {
      message.error('No se especificó la actividad a calificar');
      navigate(-1);
      return;
    }
    cargarAlumnos();
    // Si es actividad final, verificar que las zonas estén completas y cargar notas de zona
    if (actividad.TipoActividad === 'final') {
      verificarZonasCompletas();
      cargarNotasZona();
    }
  }, [actividad]);

  useEffect(() => {
    calcularEstadisticas();
  }, [calificaciones, alumnos]);

  const verificarZonasCompletas = async () => {
    try {
      // Obtener todas las actividades de zona de esta unidad
      const response = await apiClient.get(`/actividades/unidad/${unidad.IdUnidad}`);
      if (response.data.success) {
        const actividades = response.data.data || [];
        const actividadesZona = actividades.filter(a =>
          a.TipoActividad === 'zona' && (a.Estado === true || a.Estado === 1)
        );

        if (actividadesZona.length === 0) {
          // No hay actividades de zona, permitir calificar finales
          setZonasCompletas(true);
          return;
        }

        // Verificar que todas las actividades de zona tengan calificaciones completas
        let todasCompletas = true;
        for (const actZona of actividadesZona) {
          const respCalif = await apiClient.get(`/actividades/${actZona.IdActividad}/alumnos`);
          if (respCalif.data.success) {
            const alumnosZona = respCalif.data.data || [];
            const sinCalificar = alumnosZona.filter(alumno =>
              !alumno.IdCalificacion || alumno.Punteo === null || alumno.Punteo === undefined
            );
            if (sinCalificar.length > 0) {
              todasCompletas = false;
              break;
            }
          }
        }

        setZonasCompletas(todasCompletas);

        if (!todasCompletas) {
          message.warning({
            content: 'Debes completar todas las calificaciones de zona antes de calificar actividades finales',
            duration: 8
          });
        }
      }
    } catch (error) {
      console.error('Error al verificar zonas completas:', error);
      setZonasCompletas(false);
    }
  };

  const cargarNotasZona = async () => {
    try {
      // Obtener todas las actividades de zona de esta unidad
      const response = await apiClient.get(`/actividades/unidad/${unidad.IdUnidad}`);
      if (response.data.success) {
        const actividades = response.data.data || [];
        const actividadesZona = actividades.filter(a =>
          a.TipoActividad === 'zona' && (a.Estado === true || a.Estado === 1)
        );

        // Objeto para acumular notas por alumno
        const notasZona = {};

        // Cargar calificaciones de cada actividad de zona
        for (const actZona of actividadesZona) {
          const respCalif = await apiClient.get(`/actividades/${actZona.IdActividad}/alumnos`);
          if (respCalif.data.success) {
            const alumnosZona = respCalif.data.data || [];
            alumnosZona.forEach(alumno => {
              if (alumno.Punteo !== null && alumno.Punteo !== undefined) {
                if (!notasZona[alumno.IdAlumno]) {
                  notasZona[alumno.IdAlumno] = 0;
                }
                notasZona[alumno.IdAlumno] += parseFloat(alumno.Punteo);
              }
            });
          }
        }

        setNotasZonaPorAlumno(notasZona);
      }
    } catch (error) {
      console.error('Error al cargar notas de zona:', error);
    }
  };

  const cargarAlumnos = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/actividades/${actividad.IdActividad}/alumnos`);
      if (response.data.success) {
        const alumnosData = response.data.data || [];
        setAlumnos(alumnosData);

        // Cargar calificaciones existentes en el estado
        const calificacionesIniciales = {};
        alumnosData.forEach(alumno => {
          if (alumno.IdCalificacion) {
            calificacionesIniciales[alumno.IdAlumno] = {
              IdCalificacion: alumno.IdCalificacion,
              Punteo: alumno.Punteo,
              Observaciones: alumno.Observaciones
            };
          }
        });
        setCalificaciones(calificacionesIniciales);
      }
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
      message.error('Error al cargar la lista de alumnos');
    } finally {
      setLoading(false);
    }
  };

  const handlePunteoChange = (idAlumno, valor) => {
    setCalificaciones(prev => ({
      ...prev,
      [idAlumno]: {
        ...prev[idAlumno],
        Punteo: valor
      }
    }));
  };

  const handleObservacionChange = (idAlumno, valor) => {
    setCalificaciones(prev => ({
      ...prev,
      [idAlumno]: {
        ...prev[idAlumno],
        Observaciones: valor
      }
    }));
  };

  const handleGuardar = async () => {
    // Preparar array de calificaciones
    const calificacionesArray = Object.entries(calificaciones)
      .filter(([_, data]) => data.Punteo !== undefined && data.Punteo !== null)
      .map(([idAlumno, data]) => ({
        IdAlumno: parseInt(idAlumno),
        Punteo: parseFloat(data.Punteo),
        Observaciones: data.Observaciones || null
      }));

    if (calificacionesArray.length === 0) {
      message.warning('No hay calificaciones para guardar');
      return;
    }

    setGuardando(true);
    try {
      const response = await apiClient.post(
        `/calificaciones/actividad/${actividad.IdActividad}/batch`,
        { calificaciones: calificacionesArray }
      );

      if (response.data.success) {
        message.success(
          `Calificaciones guardadas: ${response.data.creadas} creadas, ${response.data.actualizadas} actualizadas`
        );
        // Recargar para obtener IDs de calificaciones creadas
        await cargarAlumnos();
      }
    } catch (error) {
      console.error('Error al guardar calificaciones:', error);

      // Manejar error específico de unidad cerrada
      if (error.response?.data?.unidadCerrada) {
        message.error({
          content: error.response.data.error || 'La unidad está cerrada. Debes solicitar reapertura al administrador.',
          duration: 5
        });
      } else {
        message.error(error.response?.data?.error || 'Error al guardar las calificaciones');
      }
    } finally {
      setGuardando(false);
    }
  };

  const calcularEstadisticas = () => {
    const calificacionesValidas = Object.values(calificaciones)
      .filter(c => c.Punteo !== undefined && c.Punteo !== null)
      .map(c => parseFloat(c.Punteo));

    if (calificacionesValidas.length === 0) {
      setEstadisticas(null);
      return;
    }

    const suma = calificacionesValidas.reduce((acc, val) => acc + val, 0);
    const promedio = suma / calificacionesValidas.length;
    const maximo = Math.max(...calificacionesValidas);
    const minimo = Math.min(...calificacionesValidas);

    setEstadisticas({
      calificados: calificacionesValidas.length,
      pendientes: alumnos.length - calificacionesValidas.length,
      promedio: promedio.toFixed(2),
      maximo: maximo.toFixed(2),
      minimo: minimo.toFixed(2),
      porcentaje: ((calificacionesValidas.length / alumnos.length) * 100).toFixed(1)
    });
  };

  const columnas = [
    {
      title: 'Carnet',
      dataIndex: 'IdAlumno',
      key: 'IdAlumno',
      width: 120,
      fixed: 'left',
      sorter: (a, b) => a.IdAlumno - b.IdAlumno
    },
    {
      title: 'Apellidos',
      dataIndex: 'Apellidos',
      key: 'Apellidos',
      width: 200,
      fixed: 'left',
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.Apellidos.localeCompare(b.Apellidos)
    },
    {
      title: 'Nombres',
      dataIndex: 'Nombres',
      key: 'Nombres',
      width: 200,
      sorter: (a, b) => a.Nombres.localeCompare(b.Nombres)
    },
    {
      title: actividad?.TipoActividad === 'final'
        ? `Punteo Final (0 - ${actividad?.PunteoMaximo || 0} pts)`
        : `Punteo (0 - ${actividad?.PunteoMaximo || 0} pts)`,
      key: 'Punteo',
      width: actividad?.TipoActividad === 'final' ? 280 : 200,
      render: (_, record) => {
        const notaZona = parseFloat(notasZonaPorAlumno[record.IdAlumno]) || 0;
        const punteoFinal = parseFloat(calificaciones[record.IdAlumno]?.Punteo) || 0;
        const total = notaZona + punteoFinal;
        const aprueba = total >= 60;

        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <InputNumber
              min={0}
              max={parseFloat(actividad.PunteoMaximo)}
              step={0.25}
              precision={2}
              value={calificaciones[record.IdAlumno]?.Punteo}
              onChange={(valor) => handlePunteoChange(record.IdAlumno, valor)}
              style={{ width: '100%' }}
              placeholder="0.00"
              disabled={actividad?.TipoActividad === 'final' && !zonasCompletas}
            />
            {actividad?.TipoActividad === 'final' && notaZona > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '4px 8px',
                backgroundColor: punteoFinal > 0 ? (aprueba ? '#f6ffed' : '#fff2e8') : '#fafafa',
                borderRadius: '4px',
                border: punteoFinal > 0 ? (aprueba ? '1px solid #b7eb8f' : '1px solid #ffbb96') : '1px solid #d9d9d9'
              }}>
                <span style={{ fontSize: '11px', color: '#666' }}>
                  Zona: <strong style={{ color: '#1890ff' }}>{notaZona.toFixed(2)}</strong>
                </span>
                {punteoFinal > 0 && (
                  <Tag
                    color={aprueba ? 'success' : 'error'}
                    style={{ margin: 0, fontWeight: 'bold' }}
                  >
                    Total: {Math.round(total)} {aprueba ? '✓' : '✗'}
                  </Tag>
                )}
              </div>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Observaciones',
      key: 'Observaciones',
      width: 300,
      render: (_, record) => (
        <TextArea
          rows={1}
          value={calificaciones[record.IdAlumno]?.Observaciones || ''}
          onChange={(e) => handleObservacionChange(record.IdAlumno, e.target.value)}
          placeholder="Observaciones opcionales"
          maxLength={200}
          disabled={actividad?.TipoActividad === 'final' && !zonasCompletas}
        />
      )
    },
    {
      title: 'Estado',
      key: 'Estado',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const tieneCalificacion = calificaciones[record.IdAlumno]?.Punteo !== undefined &&
                                  calificaciones[record.IdAlumno]?.Punteo !== null;
        return tieneCalificacion ? (
          <Tag icon={<CheckCircleOutlined />} color="success">Calificado</Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning">Pendiente</Tag>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={volverAActividades}
              style={{ paddingLeft: 0 }}
            >
              Volver a Actividades
            </Button>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Calificar: {actividad?.NombreActividad}
            </div>
            <Space size="middle" wrap>
              <Tag color="blue">
                Punteo Máximo: {actividad?.PunteoMaximo} pts
              </Tag>
              <Tag color={actividad?.TipoActividad === 'zona' ? 'blue' : 'green'}>
                Tipo: {actividad?.TipoActividad === 'zona' ? 'Zona' : 'Final'}
              </Tag>
              <Tag color="purple">
                Fecha: {actividad?.FechaActividad ? dayjs(actividad.FechaActividad).format('DD/MM/YYYY') : 'Sin fecha'}
              </Tag>
            </Space>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {unidad?.NombreUnidad} - {asignacion?.NombreCurso} ({asignacion?.NombreGrado} {asignacion?.NombreSeccion})
            </div>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleGuardar}
              loading={guardando}
              size="large"
              disabled={actividad?.TipoActividad === 'final' && !zonasCompletas}
            >
              Guardar Calificaciones
            </Button>
          </Space>
        }
      >
        {/* Alerta cuando es actividad final y zonas no están completas */}
        {actividad?.TipoActividad === 'final' && !zonasCompletas && (
          <Alert
            message="No puedes calificar actividades finales aún"
            description="Primero debes completar todas las calificaciones de las actividades de zona de esta unidad. Una vez completadas, podrás ingresar las calificaciones finales."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
            closable
          />
        )}

        {/* Estadísticas */}
        {estadisticas && (
          <Card style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Progreso"
                  value={estadisticas.porcentaje}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                />
                <Progress
                  percent={parseFloat(estadisticas.porcentaje)}
                  status={parseFloat(estadisticas.porcentaje) === 100 ? 'success' : 'active'}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Statistic
                  title="Calificados"
                  value={estadisticas.calificados}
                  suffix={`/ ${alumnos.length}`}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Statistic
                  title="Pendientes"
                  value={estadisticas.pendientes}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col xs={8} sm={8} md={3}>
                <Statistic
                  title="Promedio"
                  value={estadisticas.promedio}
                  suffix="pts"
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col xs={8} sm={8} md={3}>
                <Statistic
                  title="Máximo"
                  value={estadisticas.maximo}
                  suffix="pts"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={8} sm={8} md={4}>
                <Statistic
                  title="Mínimo"
                  value={estadisticas.minimo}
                  suffix="pts"
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
        )}

        <Spin spinning={loading}>
          <Table
            columns={columnas}
            dataSource={alumnos}
            rowKey="IdAlumno"
            pagination={{
              pageSize: 20,
              showTotal: (total) => `Total: ${total} estudiantes`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
            bordered
            scroll={{ x: 1200 }}
            locale={{
              emptyText: 'No hay estudiantes inscritos en este curso'
            }}
            rowClassName={(record) => {
              const tieneCalificacion = calificaciones[record.IdAlumno]?.Punteo !== undefined &&
                                        calificaciones[record.IdAlumno]?.Punteo !== null;
              return tieneCalificacion ? '' : 'row-pendiente';
            }}
            defaultSortField="Apellidos"
            defaultSortOrder="ascend"
          />
        </Spin>
      </Card>

      <style>{`
        .row-pendiente {
          background-color: #fffbe6;
        }
        .row-pendiente:hover {
          background-color: #fff7cc !important;
        }
      `}</style>
    </div>
  );
};

export default CalificarActividad;

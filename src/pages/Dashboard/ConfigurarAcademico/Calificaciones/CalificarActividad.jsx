import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card, Table, InputNumber, Input, Button, message, Statistic, Row, Col,
  Space, Tag, Alert, Progress, Tooltip, Spin
} from 'antd';
import {
  SaveOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  ClockCircleOutlined, TrophyOutlined, BarChartOutlined
} from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';
import dayjs from 'dayjs';

const { TextArea } = Input;

const CalificarActividad = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { actividad, unidad, asignacion } = location.state || {};

  const [alumnos, setAlumnos] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    if (!actividad) {
      message.error('No se especificó la actividad a calificar');
      navigate(-1);
      return;
    }
    cargarAlumnos();
  }, [actividad]);

  useEffect(() => {
    calcularEstadisticas();
  }, [calificaciones, alumnos]);

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

  const validarFechaLimite = () => {
    if (!actividad.FechaActividad) return true;

    const fechaActividad = dayjs(actividad.FechaActividad);
    const fechaLimite = fechaActividad.add(4, 'days');
    const hoy = dayjs();

    return hoy.isBefore(fechaLimite) || hoy.isSame(fechaLimite, 'day');
  };

  const diasRestantes = () => {
    if (!actividad.FechaActividad) return null;

    const fechaActividad = dayjs(actividad.FechaActividad);
    const fechaLimite = fechaActividad.add(4, 'days');
    const hoy = dayjs();

    return fechaLimite.diff(hoy, 'days');
  };

  const handleGuardar = async () => {
    const dentroDelPlazo = validarFechaLimite();
    if (!dentroDelPlazo) {
      message.warning('El plazo para calificar esta actividad ha expirado (4 días después de la fecha de actividad)');
      return;
    }

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
      message.error(error.response?.data?.error || 'Error al guardar las calificaciones');
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
      title: `Punteo (0 - ${actividad?.PunteoMaximo || 0} pts)`,
      key: 'Punteo',
      width: 200,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={parseFloat(actividad.PunteoMaximo)}
          step={0.25}
          precision={2}
          value={calificaciones[record.IdAlumno]?.Punteo}
          onChange={(valor) => handlePunteoChange(record.IdAlumno, valor)}
          style={{ width: '100%' }}
          placeholder="0.00"
          disabled={!validarFechaLimite()}
        />
      )
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
          disabled={!validarFechaLimite()}
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

  const dias = diasRestantes();
  const fueraDePlazo = !validarFechaLimite();

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
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
              {dias !== null && (
                <Tag color={dias >= 0 ? 'green' : 'red'}>
                  {dias >= 0 ? `${dias} días restantes` : 'Plazo vencido'}
                </Tag>
              )}
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
              disabled={fueraDePlazo}
            >
              Guardar Calificaciones
            </Button>
          </Space>
        }
      >
        {fueraDePlazo && (
          <Alert
            message="Plazo de calificación vencido"
            description={`El plazo para calificar esta actividad expiró ${Math.abs(dias)} días atrás. Solo puedes visualizar las calificaciones.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
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

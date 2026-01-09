import { useState, useEffect } from 'react';
import {
  Modal, Table, InputNumber, Input, message, Statistic, Row, Col,
  Space, Tag, Progress, Spin, Alert, Button
} from 'antd';
import {
  SaveOutlined, CheckCircleOutlined, ClockCircleOutlined,
  TrophyOutlined, BarChartOutlined, WarningOutlined
} from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';
import dayjs from 'dayjs';

const { TextArea } = Input;

const CalificarActividadModal = ({ visible, onClose, actividad, unidad, asignacion, onCalificacionesGuardadas }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [zonasCompletas, setZonasCompletas] = useState(true);
  const [notasZonaPorAlumno, setNotasZonaPorAlumno] = useState({}); // { IdAlumno: notaZonaTotal }

  // Verificar si la unidad está cerrada
  const unidadCerrada = unidad?.Activa === 0 || unidad?.Activa === false;

  useEffect(() => {
    if (visible && actividad) {
      cargarAlumnos();
      // Si es actividad final, verificar que las zonas estén completas y cargar notas de zona
      if (actividad.TipoActividad === 'final') {
        verificarZonasCompletas();
        cargarNotasZona();
      }
    }
  }, [visible, actividad]);

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

        // Notificar al componente padre que se guardaron calificaciones
        if (onCalificacionesGuardadas) {
          onCalificacionesGuardadas();
        }
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
      width: 90,
      sorter: (a, b) => a.IdAlumno - b.IdAlumno,
      align: 'center'
    },
    {
      title: 'Alumno',
      key: 'Alumno',
      width: 250,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.Apellidos.localeCompare(b.Apellidos),
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.Apellidos}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.Nombres}</div>
        </div>
      )
    },
    {
      title: actividad?.TipoActividad === 'final'
        ? `Punteo Final / Zona / Total (0 - ${actividad?.PunteoMaximo || 0} pts)`
        : `Punteo (0 - ${actividad?.PunteoMaximo || 0} pts)`,
      key: 'Punteo',
      width: actividad?.TipoActividad === 'final' ? 300 : 150,
      render: (_, record) => {
        const notaZona = parseFloat(notasZonaPorAlumno[record.IdAlumno]) || 0;
        const punteoFinal = parseFloat(calificaciones[record.IdAlumno]?.Punteo) || 0;
        const total = notaZona + punteoFinal;
        const aprueba = total >= 60;

        // Si es actividad final, mostrar en una línea compacta
        if (actividad?.TipoActividad === 'final') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
              <InputNumber
                min={0}
                max={parseFloat(actividad.PunteoMaximo)}
                step={0.25}
                precision={2}
                value={calificaciones[record.IdAlumno]?.Punteo}
                onChange={(valor) => handlePunteoChange(record.IdAlumno, valor)}
                style={{ width: '90px', flexShrink: 0 }}
                placeholder="0.00"
                disabled={unidadCerrada || !zonasCompletas}
                size="small"
              />
              {notaZona > 0 && (
                <>
                  <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                    Zona: <strong style={{ color: '#1890ff' }}>{notaZona.toFixed(2)}</strong>
                  </span>
                  {punteoFinal > 0 && (
                    <Tag
                      color={aprueba ? 'success' : 'error'}
                      style={{ margin: 0, fontWeight: 'bold', fontSize: '11px' }}
                    >
                      Total: {Math.round(total)} {aprueba ? '✓' : '✗'}
                    </Tag>
                  )}
                </>
              )}
            </div>
          );
        }

        // Si es actividad de zona, mostrar normal
        return (
          <InputNumber
            min={0}
            max={parseFloat(actividad.PunteoMaximo)}
            step={0.25}
            precision={2}
            value={calificaciones[record.IdAlumno]?.Punteo}
            onChange={(valor) => handlePunteoChange(record.IdAlumno, valor)}
            style={{ width: '100%' }}
            placeholder="0.00"
            disabled={unidadCerrada}
            size="small"
          />
        );
      }
    },
    {
      title: 'Observaciones (opcional)',
      key: 'Observaciones',
      width: 200,
      render: (_, record) => (
        <TextArea
          rows={1}
          value={calificaciones[record.IdAlumno]?.Observaciones || ''}
          onChange={(e) => handleObservacionChange(record.IdAlumno, e.target.value)}
          placeholder="Opcional"
          maxLength={200}
          disabled={unidadCerrada || (actividad?.TipoActividad === 'final' && !zonasCompletas)}
          size="small"
          style={{ fontSize: '12px' }}
        />
      )
    },
    {
      title: 'Estado',
      key: 'Estado',
      width: 90,
      align: 'center',
      render: (_, record) => {
        const tieneCalificacion = calificaciones[record.IdAlumno]?.Punteo !== undefined &&
                                  calificaciones[record.IdAlumno]?.Punteo !== null;
        return tieneCalificacion ? (
          <CheckCircleOutlined style={{ fontSize: '18px', color: '#52c41a' }} />
        ) : (
          <ClockCircleOutlined style={{ fontSize: '18px', color: '#faad14' }} />
        );
      }
    }
  ];

  const handleClose = () => {
    // Reset estados al cerrar
    setAlumnos([]);
    setCalificaciones({});
    setEstadisticas(null);
    setNotasZonaPorAlumno({});
    setZonasCompletas(true);
    onClose();
  };

  return (
    <Modal
      title={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
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
          <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            {unidad?.NombreUnidad} - {asignacion?.NombreCurso} ({asignacion?.NombreGrado} {asignacion?.NombreSeccion})
          </div>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width="95%"
      style={{ top: 20 }}
      footer={[
        <Button key="cancelar" onClick={handleClose}>
          Cerrar
        </Button>,
        <Button
          key="guardar"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleGuardar}
          loading={guardando}
          disabled={unidadCerrada || (actividad?.TipoActividad === 'final' && !zonasCompletas)}
        >
          Guardar Calificaciones
        </Button>
      ]}
    >
      {/* Alerta cuando la unidad está cerrada */}
      {unidadCerrada && (
        <Alert
          message="Unidad Cerrada - Solo Lectura"
          description="Esta unidad ya está cerrada. Las calificaciones ya fueron registradas en la tabla de notas finales y no pueden ser modificadas. Si necesitas hacer cambios, debes solicitar la reapertura de la unidad al administrador."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable={false}
        />
      )}

      {/* Alerta cuando es actividad final y zonas no están completas */}
      {!unidadCerrada && actividad?.TipoActividad === 'final' && !zonasCompletas && (
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
        <div style={{ marginBottom: 16, padding: '16px', backgroundColor: '#f0f2f5', borderRadius: '8px' }}>
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
        </div>
      )}

      <Spin spinning={loading}>
        <Table
          columns={columnas}
          dataSource={alumnos}
          rowKey="IdAlumno"
          size="small"
          pagination={{
            pageSize: 25,
            showTotal: (total) => `Total: ${total} estudiantes`,
            showSizeChanger: true,
            pageSizeOptions: ['15', '25', '50', '100']
          }}
          bordered
          scroll={{ x: 1000, y: 450 }}
          locale={{
            emptyText: 'No hay estudiantes inscritos en este curso'
          }}
          rowClassName={(record) => {
            const tieneCalificacion = calificaciones[record.IdAlumno]?.Punteo !== undefined &&
                                      calificaciones[record.IdAlumno]?.Punteo !== null;
            return tieneCalificacion ? '' : 'row-pendiente';
          }}
        />
      </Spin>

      <style>{`
        .row-pendiente {
          background-color: #fffbe6;
        }
        .row-pendiente:hover {
          background-color: #fff7cc !important;
        }
      `}</style>
    </Modal>
  );
};

export default CalificarActividadModal;

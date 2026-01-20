import React, { useState, useEffect } from 'react';
import { Card, Spin, message, Typography, Empty, Badge, Button } from 'antd';
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/es';
import apiClient from '../../../../api/apiClient';
import { getCicloActual } from '../../../../utils/cicloEscolar';
import DetalleActividadesDia from './components/DetalleActividadesDia';

const { Title, Text } = Typography;

moment.locale('es');

const CalendarioTareas = () => {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const anioActual = getCicloActual();

  // Estado para el mes actual (0-9 representa enero-octubre)
  const [mesActual, setMesActual] = useState(() => {
    const hoy = moment();
    const inicioCiclo = moment(`${anioActual}-01-01`);
    const finCiclo = moment(`${anioActual}-10-31`);

    // Si hoy está dentro del ciclo, usar mes actual, si no enero (0)
    if (hoy.isSameOrAfter(inicioCiclo) && hoy.isSameOrBefore(finCiclo)) {
      return hoy.month(); // 0-11
    }
    return 0; // Enero
  });

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actividadesDia, setActividadesDia] = useState([]);

  useEffect(() => {
    cargarActividades();
  }, []);

  const cargarActividades = async () => {
    try {
      setLoading(true);

      // Obtener perfil del usuario autenticado
      const perfilRes = await apiClient.get('/login/perfil');
      const perfil = perfilRes.data?.data || perfilRes.data;

      if (!perfil) {
        message.error('No se pudo obtener el perfil del usuario');
        setLoading(false);
        return;
      }

      const idAlumno = perfil.IdAlumno;

      if (!idAlumno) {
        message.error('Este usuario no es un estudiante');
        setLoading(false);
        return;
      }

      // Cargar actividades del año completo
      const url = `/alumnos/${idAlumno}/actividades/${anioActual}`;
      const response = await apiClient.get(url);
      const actividadesData = response.data?.data || response.data || [];

      setActividades(Array.isArray(actividadesData) ? actividadesData : []);
      setLoading(false);
    } catch (error) {
      message.error('Error al cargar las actividades');
      setActividades([]);
      setLoading(false);
    }
  };

  // Función para obtener actividades de un día específico
  const getActividadesPorDia = (fecha) => {
    const fechaStr = fecha.format('YYYY-MM-DD');
    return actividades.filter(act => {
      if (!act.FechaActividad) return false;
      const fechaAct = moment(act.FechaActividad).format('YYYY-MM-DD');
      return fechaAct === fechaStr;
    });
  };

  // Obtener días del mes actual
  const getDiasDelMes = () => {
    const fecha = moment(`${anioActual}-${mesActual + 1}-01`);
    const diasEnMes = fecha.daysInMonth();
    const dias = [];

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaDia = moment(`${anioActual}-${mesActual + 1}-${dia}`);
      const actividadesDia = getActividadesPorDia(fechaDia);
      dias.push({
        numero: dia,
        fecha: fechaDia,
        actividades: actividadesDia
      });
    }

    return dias;
  };

  // Navegar entre meses
  const cambiarMes = (direccion) => {
    const nuevoMes = mesActual + direccion;
    if (nuevoMes >= 0 && nuevoMes <= 9) {
      setMesActual(nuevoMes);
    }
  };

  // Abrir modal con actividades del día
  const handleClickDia = (dia) => {
    if (dia.actividades.length > 0) {
      setDiaSeleccionado(dia.fecha);
      setActividadesDia(dia.actividades);
      setModalVisible(true);
    }
  };

  // Obtener color según estado de la actividad
  const getColorActividad = (actividad) => {
    const fechaVencimiento = moment(actividad.FechaActividad);
    const hoy = moment();
    const diasRestantes = fechaVencimiento.diff(hoy, 'days');

    if (fechaVencimiento.isBefore(hoy, 'day')) {
      return '#ff4d4f'; // Rojo - Vencida
    } else if (diasRestantes <= 3) {
      return '#faad14'; // Naranja - Próxima a vencer
    } else {
      return '#52c41a'; // Verde - Activa
    }
  };

  const nombreMes = moment().month(mesActual).format('MMMM');
  const dias = getDiasDelMes();

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <CalendarOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Calendario de Tareas
        </Title>
        <Text type="secondary">
          Visualiza todas tus actividades y tareas en un calendario mensual
        </Text>
      </div>

      {/* Navegación del mes */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          padding: '10px 0'
        }}>
          <Button
            type="text"
            icon={<LeftOutlined />}
            onClick={() => cambiarMes(-1)}
            disabled={mesActual === 0}
            style={{ fontSize: '18px' }}
          />

          <Title level={4} style={{ margin: 0, textTransform: 'capitalize', minWidth: '200px', textAlign: 'center' }}>
            {nombreMes} {anioActual}
          </Title>

          <Button
            type="text"
            icon={<RightOutlined />}
            onClick={() => cambiarMes(1)}
            disabled={mesActual === 9}
            style={{ fontSize: '18px' }}
          />
        </div>
      </Card>

      {/* Grid de días */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Spin spinning={loading} tip="Cargando actividades...">
          {!loading && actividades.length === 0 ? (
            <Empty
              description="No hay actividades para mostrar"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
              padding: '10px 0'
            }}>
              {dias.map((dia) => {
                const esHoy = dia.fecha.isSame(moment(), 'day');
                const tieneActividades = dia.actividades.length > 0;

                return (
                  <Card
                    key={dia.numero}
                    hoverable={tieneActividades}
                    onClick={() => handleClickDia(dia)}
                    style={{
                      borderRadius: '8px',
                      border: esHoy ? '2px solid #1890ff' : '1px solid #f0f0f0',
                      cursor: tieneActividades ? 'pointer' : 'default',
                      minHeight: '100px',
                      position: 'relative',
                      background: tieneActividades ? '#fafafa' : '#fff',
                      transition: 'all 0.3s ease'
                    }}
                    bodyStyle={{ padding: '12px' }}
                  >
                    {/* Número del día */}
                    <div style={{
                      fontSize: '18px',
                      fontWeight: esHoy ? 'bold' : '600',
                      color: esHoy ? '#1890ff' : '#262626',
                      marginBottom: '8px'
                    }}>
                      {dia.numero}
                    </div>

                    {/* Lista de actividades */}
                    {dia.actividades.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {dia.actividades.slice(0, 2).map((actividad, index) => (
                          <div
                            key={index}
                            style={{
                              fontSize: '11px',
                              marginBottom: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: '#595959'
                            }}
                          >
                            <Badge
                              color={getColorActividad(actividad)}
                              text={actividad.NombreActividad}
                              style={{ fontSize: '11px' }}
                            />
                          </div>
                        ))}
                        {dia.actividades.length > 2 && (
                          <Text
                            type="secondary"
                            style={{ fontSize: '10px', fontStyle: 'italic' }}
                          >
                            +{dia.actividades.length - 2} más
                          </Text>
                        )}
                      </div>
                    )}

                    {/* Indicador de cantidad */}
                    {dia.actividades.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#1890ff',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {dia.actividades.length}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </Spin>
      </Card>

      {/* Modal con detalle de actividades del día */}
      <DetalleActividadesDia
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        fecha={diaSeleccionado}
        actividades={actividadesDia}
      />
    </div>
  );
};

export default CalendarioTareas;

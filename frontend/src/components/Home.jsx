import React, { useState, useEffect } from 'react';
import { Alert, Card, Tag, List, Spin, Empty } from 'antd';
import { BellOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const Home = ({ usuario, onLogout }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    // Solo cargar notificaciones si el usuario es docente (rol 4)
    if (usuario?.rol === 4 && usuario?.IdDocente) {
      cargarNotificaciones();
    } else {
    }
  }, [usuario]);

  const cargarNotificaciones = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/notificaciones-docentes/pendientes/${usuario.IdDocente}`);
      if (response.data.success) {
        setNotificaciones(response.data.notificaciones || []);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const calcularDiasRestantes = (fechaLimite) => {
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diferencia = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const getTipoColor = (tipo) => {
    if (tipo === 'ACTIVIDADES_INCOMPLETAS') return 'orange';
    if (tipo === 'CALIFICACIONES_PENDIENTES') return 'red';
    return 'blue';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Bienvenido, {usuario?.nombre || 'Usuario'}</h2>
      <p>Tu sesión está activa.</p>

      {/* Mostrar notificaciones solo para docentes */}
      {usuario?.rol === 4 && (
        <div style={{ marginTop: '30px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : notificaciones.length > 0 ? (
            <>
              <Alert
                message={`Tienes ${notificaciones.length} notificación(es) pendiente(s)`}
                description="Por favor completa las siguientes tareas antes de la fecha límite"
                type="warning"
                icon={<WarningOutlined />}
                showIcon
                style={{ marginBottom: '20px' }}
              />

              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
                dataSource={notificaciones}
                renderItem={(notif) => {
                  const diasRestantes = calcularDiasRestantes(notif.FechaLimite);
                  const esUrgente = diasRestantes <= 1;

                  return (
                    <List.Item>
                      <Card
                        size="small"
                        title={
                          <span>
                            <BellOutlined style={{ marginRight: 8 }} />
                            {notif.NombreCurso} - {notif.NombreGrado} {notif.NombreSeccion}
                          </span>
                        }
                        extra={
                          <Tag color={getTipoColor(notif.TipoNotificacion)}>
                            {notif.TipoNotificacion.replace('_', ' ')}
                          </Tag>
                        }
                        style={{
                          borderLeft: esUrgente ? '4px solid #ff4d4f' : '4px solid #faad14'
                        }}
                      >
                        <p style={{ marginBottom: '8px' }}>{notif.Mensaje}</p>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                          <div><strong>Unidad:</strong> {notif.NombreUnidad}</div>
                          <div><strong>Jornada:</strong> {notif.NombreJornada}</div>
                        </div>
                        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            <ClockCircleOutlined /> Fecha límite: {dayjs(notif.FechaLimite, 'YYYY-MM-DD').format('DD/MM/YYYY')}
                          </span>
                          {esUrgente ? (
                            <Tag color="red">¡URGENTE! {diasRestantes} día(s)</Tag>
                          ) : (
                            <Tag color="orange">{diasRestantes} día(s) restantes</Tag>
                          )}
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            </>
          ) : (
            <Empty description="No tienes notificaciones pendientes" />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
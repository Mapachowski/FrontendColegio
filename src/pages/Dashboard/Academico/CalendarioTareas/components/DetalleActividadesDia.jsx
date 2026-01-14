import React from 'react';
import { Drawer, Card, Space, Typography, Tag, Empty, Divider } from 'antd';
import {
  FileTextOutlined,
  BookOutlined,
  TrophyOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;

const DetalleActividadesDia = ({ visible, onClose, fecha, actividades }) => {
  const getColorEstado = (actividad) => {
    const fechaVencimiento = moment(actividad.FechaActividad);
    const hoy = moment();
    const diasRestantes = fechaVencimiento.diff(hoy, 'days');

    // Si la fecha ya pasó, mostrar como "Cerrada" en gris
    if (fechaVencimiento.isBefore(hoy, 'day')) {
      return 'default'; // Gris - Cerrada
    } else if (diasRestantes <= 3) {
      return 'orange'; // Próxima a vencer
    } else {
      return 'green'; // Activa
    }
  };

  const getTextoEstado = (actividad) => {
    const fechaVencimiento = moment(actividad.FechaActividad);
    const hoy = moment();
    const diasRestantes = fechaVencimiento.diff(hoy, 'days');

    // Si la fecha ya pasó, mostrar como "Cerrada"
    if (fechaVencimiento.isBefore(hoy, 'day')) {
      return 'Cerrada';
    } else if (diasRestantes === 0) {
      return 'Vence Hoy';
    } else if (diasRestantes <= 3) {
      return `Vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`;
    } else {
      return 'Activa';
    }
  };

  return (
    <Drawer
      title={
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <span>
            Actividades del {fecha ? fecha.format('DD [de] MMMM [de] YYYY') : ''}
          </span>
        </Space>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={visible}
    >
      {!actividades || actividades.length === 0 ? (
        <Empty
          description="No hay actividades para este día"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Total de actividades */}
          <div style={{
            background: '#f0f5ff',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #adc6ff'
          }}>
            <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
              📚 Total de actividades: {actividades.length}
            </Text>
          </div>

          {/* Lista de actividades */}
          {actividades.map((actividad, index) => (
            <Card
              key={index}
              style={{
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${
                  getColorEstado(actividad) === 'default' ? '#d9d9d9' :
                  getColorEstado(actividad) === 'orange' ? '#faad14' :
                  '#52c41a'
                }`
              }}
              bodyStyle={{ padding: '20px' }}
            >
              {/* Nombre de la actividad */}
              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <FileTextOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
                  <Title level={5} style={{ margin: 0 }}>
                    {actividad.NombreActividad || 'Sin nombre'}
                  </Title>
                </Space>
                <Tag
                  color={getColorEstado(actividad)}
                  style={{ marginTop: '8px' }}
                >
                  {getTextoEstado(actividad)}
                </Tag>
              </div>

              {/* Curso */}
              <div style={{ marginBottom: '12px' }}>
                <Space align="start">
                  <BookOutlined style={{ fontSize: '16px', color: '#722ed1', marginTop: '2px' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      Curso
                    </Text>
                    <Text strong style={{ fontSize: '14px' }}>
                      {actividad.NombreCurso || 'Sin curso'}
                    </Text>
                  </div>
                </Space>
              </div>

              {/* Docente */}
              {actividad.NombreDocente && (
                <div style={{ marginBottom: '12px' }}>
                  <Space align="start">
                    <UserOutlined style={{ fontSize: '16px', color: '#1890ff', marginTop: '2px' }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                        Catedrático
                      </Text>
                      <Text strong style={{ fontSize: '14px' }}>
                        {actividad.NombreDocente}
                      </Text>
                    </div>
                  </Space>
                </div>
              )}

              {/* Descripción */}
              {actividad.Descripcion && (
                <>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ marginBottom: '12px' }}>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                      Descripción
                    </Text>
                    <Paragraph style={{ margin: 0, fontSize: '13px', color: '#595959' }}>
                      {actividad.Descripcion}
                    </Paragraph>
                  </div>
                </>
              )}

              {/* Footer con punteo y fecha */}
              <Divider style={{ margin: '12px 0' }} />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* Punteo Máximo */}
                <Space>
                  <TrophyOutlined style={{ fontSize: '16px', color: '#faad14' }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Punteo Máximo
                    </Text>
                    <Text strong style={{ fontSize: '14px', color: '#faad14' }}>
                      {actividad.PunteoMaximo || '0.00'} pts
                    </Text>
                  </div>
                </Space>

                {/* Fecha de vencimiento */}
                <Space>
                  <ClockCircleOutlined style={{
                    fontSize: '16px',
                    color: getColorEstado(actividad) === 'default' ? '#d9d9d9' :
                           getColorEstado(actividad) === 'orange' ? '#faad14' :
                           '#52c41a'
                  }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                      Vencimiento
                    </Text>
                    <Text strong style={{ fontSize: '13px' }}>
                      {moment(actividad.FechaActividad).format('DD/MM/YYYY')}
                    </Text>
                  </div>
                </Space>
              </div>

              {/* Unidad (opcional) */}
              {actividad.NombreUnidad && (
                <div style={{ marginTop: '12px' }}>
                  <Tag color="purple" style={{ fontSize: '11px' }}>
                    {actividad.NombreUnidad}
                  </Tag>
                  {actividad.TipoActividad && (
                    <Tag color="blue" style={{ fontSize: '11px' }}>
                      {actividad.TipoActividad}
                    </Tag>
                  )}
                </div>
              )}
            </Card>
          ))}
        </Space>
      )}
    </Drawer>
  );
};

export default DetalleActividadesDia;

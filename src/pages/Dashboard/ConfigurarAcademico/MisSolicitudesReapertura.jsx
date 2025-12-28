import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message, Empty, Spin } from 'antd';
import { UnlockOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import dayjs from 'dayjs';

const MisSolicitudesReapertura = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/solicitudes-reapertura/mis-solicitudes');
      if (response.data.success) {
        setSolicitudes(response.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      message.error('Error al cargar las solicitudes de reapertura');
    } finally {
      setLoading(false);
    }
  };

  const columnas = [
    {
      title: 'Unidad',
      dataIndex: 'NombreUnidad',
      key: 'NombreUnidad',
      width: 250,
      render: (texto, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{texto}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.NombreCurso}
          </div>
        </div>
      )
    },
    {
      title: 'Motivo',
      dataIndex: 'Motivo',
      key: 'Motivo',
      width: 300,
      ellipsis: true
    },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'Estado',
      width: 130,
      align: 'center',
      render: (estado) => {
        const config = {
          pendiente: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pendiente' },
          aprobada: { color: 'success', icon: <CheckCircleOutlined />, text: 'Aprobada' },
          rechazada: { color: 'error', icon: <CloseCircleOutlined />, text: 'Rechazada' }
        };
        const { color, icon, text } = config[estado] || config.pendiente;
        return <Tag icon={icon} color={color}>{text}</Tag>;
      },
      filters: [
        { text: 'Pendiente', value: 'pendiente' },
        { text: 'Aprobada', value: 'aprobada' },
        { text: 'Rechazada', value: 'rechazada' }
      ],
      onFilter: (value, record) => record.Estado === value
    },
    {
      title: 'Fecha Solicitud',
      dataIndex: 'FechaSolicitud',
      key: 'FechaSolicitud',
      width: 150,
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.FechaSolicitud).unix() - dayjs(b.FechaSolicitud).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Respuesta',
      key: 'respuesta',
      width: 300,
      render: (_, record) => {
        if (record.Estado === 'pendiente') {
          return <span style={{ color: '#999', fontStyle: 'italic' }}>En espera de respuesta...</span>;
        }
        return (
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
              <strong>Procesado por:</strong> {record.AprobadoPor || 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
              <strong>Fecha:</strong> {record.FechaAprobacion ? dayjs(record.FechaAprobacion).format('DD/MM/YYYY HH:mm') : 'N/A'}
            </div>
            {record.ObservacionesAprobacion && (
              <div style={{ fontSize: '12px', color: '#333' }}>
                <strong>Observaciones:</strong> {record.ObservacionesAprobacion}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <UnlockOutlined /> Mis Solicitudes de Reapertura
          </span>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={cargarSolicitudes}
            loading={loading}
          >
            Actualizar
          </Button>
        }
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          Aquí puedes ver el historial de tus solicitudes de reapertura de unidades y su estado actual.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : solicitudes.length === 0 ? (
          <Empty
            description="No has realizado solicitudes de reapertura"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columnas}
            dataSource={solicitudes}
            rowKey="IdSolicitud"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total: ${total} solicitudes`,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50']
            }}
            bordered
            scroll={{ x: 1200 }}
          />
        )}
      </Card>
    </div>
  );
};

export default MisSolicitudesReapertura;

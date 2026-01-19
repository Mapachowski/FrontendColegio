import { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message, Modal, Form, Input, Badge, Spin, Empty } from 'antd';
import { UnlockOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import dayjs from 'dayjs';

const { TextArea } = Input;

const GestionarSolicitudesReapertura = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [accionActual, setAccionActual] = useState(null); // 'aprobar' o 'rechazar'
  const [form] = Form.useForm();

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/solicitudes-reapertura/pendientes');
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

  const abrirModalProcesar = (solicitud, accion) => {
    setSolicitudActual(solicitud);
    setAccionActual(accion);
    setModalVisible(true);
  };

  const procesarSolicitud = async (values) => {
    try {
      const response = await apiClient.put(`/solicitudes-reapertura/${solicitudActual.IdSolicitud}/procesar`, {
        accion: accionActual,
        observaciones: values.observaciones || ''
      });

      if (response.data.success) {
        message.success(response.data.message || `Solicitud ${accionActual === 'aprobar' ? 'aprobada' : 'rechazada'} exitosamente`);
        form.resetFields();
        setModalVisible(false);
        setSolicitudActual(null);
        setAccionActual(null);
        cargarSolicitudes(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al procesar solicitud:', error);
      const errorMsg = error.response?.data?.error || 'Error al procesar la solicitud';
      message.error(errorMsg);
    }
  };

  const columnas = [
    {
      title: 'Docente',
      dataIndex: 'NombreDocente',
      key: 'NombreDocente',
      width: 180,
      fixed: 'left'
    },
    {
      title: 'Curso / Unidad',
      dataIndex: 'NombreCurso',
      key: 'NombreCurso',
      width: 280,
      render: (texto, record) => (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{texto}</div>
          <div style={{ fontSize: '12px', color: '#1890ff', marginTop: 2 }}>
            {record.NombreGrado} - {record.NombreSeccion} - {record.NombreJornada}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            {record.NombreUnidad}
          </div>
        </div>
      )
    },
    {
      title: 'Motivo',
      dataIndex: 'Motivo',
      key: 'Motivo',
      width: 300,
      ellipsis: true,
      render: (texto) => (
        <div style={{ whiteSpace: 'normal' }}>{texto}</div>
      )
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
      onFilter: (value, record) => record.Estado === value,
      defaultFilteredValue: ['pendiente'] // Por defecto mostrar solo pendientes
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
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        if (record.Estado !== 'pendiente') {
          return (
            <div style={{ fontSize: '12px', color: '#999' }}>
              Procesada el {dayjs(record.FechaAprobacion).format('DD/MM/YYYY')}
            </div>
          );
        }
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => abrirModalProcesar(record, 'aprobar')}
            >
              Aprobar
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => abrirModalProcesar(record, 'rechazar')}
            >
              Rechazar
            </Button>
          </Space>
        );
      }
    }
  ];

  const pendientesCount = solicitudes.filter(s => s.Estado === 'pendiente').length;

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <UnlockOutlined /> Gestionar Solicitudes de Reapertura
            {pendientesCount > 0 && (
              <Badge
                count={pendientesCount}
                style={{ marginLeft: 12 }}
                overflowCount={99}
              />
            )}
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
        {pendientesCount > 0 && (
          <div style={{
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '4px',
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
            <span style={{ color: '#ad6800', fontWeight: 500 }}>
              Tienes {pendientesCount} solicitud{pendientesCount !== 1 ? 'es' : ''} pendiente{pendientesCount !== 1 ? 's' : ''} de revisión
            </span>
          </div>
        )}

        <p style={{ marginBottom: 16, color: '#666' }}>
          Aquí puedes revisar y aprobar o rechazar las solicitudes de reapertura de unidades enviadas por los docentes.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : solicitudes.length === 0 ? (
          <Empty
            description="No hay solicitudes de reapertura"
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
            scroll={{ x: 1400 }}
          />
        )}
      </Card>

      <Modal
        title={
          accionActual === 'aprobar' ? (
            <span style={{ color: '#52c41a' }}>
              <CheckCircleOutlined /> Aprobar Solicitud de Reapertura
            </span>
          ) : (
            <span style={{ color: '#ff4d4f' }}>
              <CloseCircleOutlined /> Rechazar Solicitud de Reapertura
            </span>
          )
        }
        open={modalVisible}
        onCancel={() => {
          form.resetFields();
          setModalVisible(false);
          setSolicitudActual(null);
          setAccionActual(null);
        }}
        footer={null}
        width={600}
      >
        {solicitudActual && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <strong>Docente:</strong> {solicitudActual.NombreDocente}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Curso:</strong> {solicitudActual.NombreCurso}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Grado / Sección / Jornada:</strong>{' '}
              <span style={{ color: '#1890ff' }}>
                {solicitudActual.NombreGrado} - {solicitudActual.NombreSeccion} - {solicitudActual.NombreJornada}
              </span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Unidad a reabrir:</strong> {solicitudActual.NombreUnidad}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Motivo de la solicitud:</strong>
              <div style={{
                background: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: '4px',
                marginTop: 4,
                whiteSpace: 'pre-wrap'
              }}>
                {solicitudActual.Motivo}
              </div>
            </div>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={procesarSolicitud}
        >
          <Form.Item
            name="observaciones"
            label={`Observaciones ${accionActual === 'aprobar' ? '(Opcional)' : ''}`}
            rules={[
              accionActual === 'rechazar' && {
                required: true,
                message: 'Debes especificar el motivo del rechazo'
              },
              { max: 500, message: 'Las observaciones no pueden exceder 500 caracteres' }
            ].filter(Boolean)}
          >
            <TextArea
              rows={4}
              placeholder={
                accionActual === 'aprobar'
                  ? 'Puedes agregar comentarios adicionales (opcional)...'
                  : 'Especifica el motivo del rechazo...'
              }
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => {
                form.resetFields();
                setModalVisible(false);
                setSolicitudActual(null);
                setAccionActual(null);
              }}>
                Cancelar
              </Button>
              <Button
                type={accionActual === 'aprobar' ? 'primary' : 'default'}
                danger={accionActual === 'rechazar'}
                htmlType="submit"
                icon={accionActual === 'aprobar' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {accionActual === 'aprobar' ? 'Aprobar' : 'Rechazar'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GestionarSolicitudesReapertura;

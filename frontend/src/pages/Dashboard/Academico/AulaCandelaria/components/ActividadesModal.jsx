import React, { useState, useEffect } from 'react';
import { Modal, Table, Tag, Empty, Spin, message, Typography, Space } from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import moment from 'moment';
import apiClient from '../../../../../api/apiClient';

const { Text, Paragraph } = Typography;

const ActividadesModal = ({ visible, curso, esEstudiante, esDocente, onClose, idAlumno }) => {
  const [loading, setLoading] = useState(false);
  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    if (visible && curso) {
      cargarActividades();
    } else {
      setActividades([]);
    }
  }, [visible, curso]);

  const cargarActividades = async () => {
    setLoading(true);
    try {
      const idAsignacion = curso.IdAsignacionDocente || curso.idAsignacion;
      console.log('=== CARGANDO ACTIVIDADES ===');
      console.log('IdAsignacion:', idAsignacion);
      console.log('IdAlumno (para estudiantes):', idAlumno);

      let url = '';

      // Para estudiantes: necesita el idAlumno en query params
      if (esEstudiante && idAlumno) {
        url = `/asignaciones/${idAsignacion}/actividades-alumno?idAlumno=${idAlumno}`;
      }
      // Para docentes/admin: endpoint diferente (si existe)
      else {
        url = `/asignaciones/${idAsignacion}/actividades-alumno${idAlumno ? `?idAlumno=${idAlumno}` : ''}`;
      }

      console.log('🔗 URL ACTIVIDADES:', `http://localhost:4000/api${url}`);

      const response = await apiClient.get(url);
      console.log('📦 Response status:', response.status);
      console.log('📦 Response actividades:', response.data);

      let actividadesData = [];
      if (response.data.success && response.data.data) {
        actividadesData = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];
      } else if (Array.isArray(response.data)) {
        actividadesData = response.data;
      }

      console.log('📚 Total actividades cargadas:', actividadesData.length);
      console.log('📄 ESTRUCTURA DE ACTIVIDADES:');
      if (actividadesData.length > 0) {
        console.log('Primera actividad (ejemplo):', actividadesData[0]);
        console.log('Campos disponibles:', Object.keys(actividadesData[0]));
        console.log('--- Campos que estamos usando ---');
        console.log('Titulo:', actividadesData[0].Titulo);
        console.log('Descripcion:', actividadesData[0].Descripcion);
        console.log('FechaPublicacion:', actividadesData[0].FechaPublicacion);
        console.log('FechaVencimiento:', actividadesData[0].FechaVencimiento);
        console.log('Estado:', actividadesData[0].Estado);
        console.log('--- Posibles campos alternativos ---');
        console.log('FechaCreado:', actividadesData[0].FechaCreado);
        console.log('FechaActividad:', actividadesData[0].FechaActividad);
        console.log('EstadoActividad:', actividadesData[0].EstadoActividad);
        console.log('=====================================');
      }

      setActividades(actividadesData);
    } catch (error) {
      console.error('❌ Error al cargar actividades:', error);
      message.error('Error al cargar actividades');
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Actividad',
      dataIndex: 'NombreActividad',
      key: 'NombreActividad',
      width: '30%',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '14px' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {text || record.Titulo || 'Sin título'}
          </Text>
          {record.Descripcion && (
            <Paragraph
              ellipsis={{ rows: 2, expandable: true, symbol: 'ver más' }}
              style={{ margin: 0, fontSize: '12px', color: '#666' }}
            >
              {record.Descripcion}
            </Paragraph>
          )}
        </Space>
      )
    },
    {
      title: 'Fecha Publicación',
      dataIndex: 'FechaCreado',
      key: 'FechaCreado',
      width: '15%',
      align: 'center',
      render: (fecha) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <CalendarOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
          <Text style={{ fontSize: '12px' }}>
            {fecha ? moment(fecha).format('DD/MM/YYYY') : '-'}
          </Text>
        </Space>
      ),
      sorter: (a, b) => moment(a.FechaCreado).unix() - moment(b.FechaCreado).unix(),
      defaultSortOrder: 'descend' // Más recientes primero
    },
    {
      title: 'Fecha Vencimiento',
      dataIndex: 'FechaActividad',
      key: 'FechaActividad',
      width: '15%',
      align: 'center',
      render: (fecha) => {
        if (!fecha) return <Text type="secondary">Sin fecha</Text>;

        const fechaVencimiento = moment(fecha);
        const hoy = moment();
        const diasRestantes = fechaVencimiento.diff(hoy, 'days');
        const vencida = fechaVencimiento.isBefore(hoy);

        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <ClockCircleOutlined
              style={{
                color: vencida ? '#ff4d4f' : diasRestantes <= 3 ? '#faad14' : '#52c41a',
                fontSize: '16px'
              }}
            />
            <Text
              style={{
                fontSize: '12px',
                color: vencida ? '#ff4d4f' : diasRestantes <= 3 ? '#faad14' : '#000'
              }}
            >
              {fechaVencimiento.format('DD/MM/YYYY')}
            </Text>
            {!vencida && diasRestantes <= 7 && (
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {diasRestantes === 0 ? 'Hoy' : `${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`}
              </Text>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Punteo Máximo',
      dataIndex: 'PunteoMaximo',
      key: 'PunteoMaximo',
      width: '12%',
      align: 'center',
      render: (punteo) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <TrophyOutlined style={{ color: '#faad14', fontSize: '16px' }} />
          <Text strong style={{ fontSize: '13px', color: '#faad14' }}>
            {punteo || '0.00'} pts
          </Text>
        </Space>
      )
    },
    {
      title: 'Estado',
      key: 'estado',
      width: '12%',
      align: 'center',
      render: (_, record) => {
        const fechaVencimiento = record.FechaActividad ? moment(record.FechaActividad) : null;
        const hoy = moment();
        const vencida = fechaVencimiento && fechaVencimiento.isBefore(hoy, 'day');

        // Si la fecha ya pasó, mostrar como "Cerrada" en gris
        if (vencida) {
          return <Tag color="default">Cerrada</Tag>;
        }

        // Si está activa y no vencida, mostrar estado según días restantes
        if (record.EstadoActividad === 1 || record.EstadoActividad === true) {
          const diasRestantes = fechaVencimiento ? fechaVencimiento.diff(hoy, 'days') : null;

          if (diasRestantes !== null && diasRestantes <= 3) {
            return <Tag color="orange" icon={<CheckCircleOutlined />}>Activa</Tag>;
          }
          return <Tag color="green" icon={<CheckCircleOutlined />}>Activa</Tag>;
        }

        return <Tag color="default">Inactiva</Tag>;
      }
    }
  ];

  const nombreCurso = curso?.NombreCurso || curso?.Curso || curso?.nombreCurso || 'Curso';
  const nombreDocente = curso?.NombreDocente || curso?.nombreDocente || '';

  return (
    <Modal
      title={
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '18px' }}>
            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Actividades - {nombreCurso}
          </Text>
          {nombreDocente && esEstudiante && (
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Catedrático: {nombreDocente}
            </Text>
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 20 }}>Cargando actividades...</p>
        </div>
      ) : actividades.length === 0 ? (
        <Empty
          description={
            esDocente
              ? "No has publicado actividades en este curso"
              : "No hay actividades publicadas en este curso"
          }
          style={{ padding: '60px 20px' }}
        />
      ) : (
        <>
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#e6f7ff',
            borderRadius: '6px',
            border: '1px solid #91d5ff'
          }}>
            <Text style={{ fontSize: '13px' }}>
              📚 Total de actividades: <strong>{actividades.length}</strong>
              {esEstudiante && ' | Ordenadas de más reciente a más antigua'}
            </Text>
          </div>

          <Table
            columns={columns}
            dataSource={actividades}
            rowKey={(record) => record.IdActividad || record.idActividad}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total: ${total} actividades`
            }}
            locale={{
              emptyText: 'No hay actividades'
            }}
          />
        </>
      )}
    </Modal>
  );
};

export default ActividadesModal;

import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Tag, Table, message, Spin, Alert } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';

const VerAsignacionModal = ({ visible, asignacion, onCancel }) => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && asignacion) {
      console.log('=== DEBUG VER ASIGNACION ===');
      console.log('Asignacion recibida:', asignacion);
      console.log('IdAsignacionDocente:', asignacion.IdAsignacionDocente);
      console.log('===========================');
      cargarUnidades();
    } else {
      setUnidades([]);
    }
  }, [visible, asignacion]);

  const cargarUnidades = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/asignaciones/${asignacion.IdAsignacionDocente}/unidades`);

      if (response.data.success) {
        setUnidades(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar unidades:', error);
      message.error('Error al cargar unidades');
    } finally {
      setLoading(false);
    }
  };

  const columnasUnidades = [
    {
      title: 'Unidad',
      dataIndex: 'NumeroUnidad',
      key: 'NumeroUnidad',
      width: 100,
      render: (num) => <Tag color="blue">Unidad {num}</Tag>
    },
    {
      title: 'Nombre',
      dataIndex: 'NombreUnidad',
      key: 'NombreUnidad',
      width: 150
    },
    {
      title: 'Zona',
      key: 'zona',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <span>
          {record.PunteoZona} pts
        </span>
      )
    },
    {
      title: 'Final',
      key: 'final',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <span>
          {record.PunteoFinal} pts
        </span>
      )
    },
    {
      title: 'Activa',
      dataIndex: 'Activa',
      key: 'Activa',
      width: 100,
      align: 'center',
      render: (activa) => (
        activa === 1 ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Sí
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            No
          </Tag>
        )
      )
    },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'Estado',
      width: 100,
      align: 'center',
      render: (estado) => (
        <Tag color={estado ? 'green' : 'red'}>
          {estado ? 'Activo' : 'Inactivo'}
        </Tag>
      )
    }
  ];

  if (!asignacion) return null;

  return (
    <Modal
      title={
        <span>
          <EyeOutlined /> Detalles de Asignación
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Año Escolar" span={2}>
          <Tag color="blue" style={{ fontSize: 14 }}>{asignacion.Anio}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Docente" span={2}>
          {asignacion.NombreDocente || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Curso" span={2}>
          <strong>{asignacion.NombreCurso || 'N/A'}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Grado">
          {asignacion.NombreGrado || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Sección">
          {asignacion.NombreSeccion || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Jornada" span={2}>
          {asignacion.NombreJornada || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Estado">
          <Tag color={asignacion.Estado ? 'green' : 'red'}>
            {asignacion.Estado ? 'Activo' : 'Inactivo'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 24, marginBottom: 16 }}>
        <h3>
          <CheckCircleOutlined /> Unidades Creadas Automáticamente
        </h3>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="Cargando unidades..." />
        </div>
      ) : unidades.length > 0 ? (
        <>
          <Alert
            message="Información sobre Unidades"
            description="Al crear una asignación, se generan automáticamente 4 unidades. Solo la Unidad 1 se crea activa por defecto. Las demás deben activarse manualmente después de configurar sus actividades (60 pts zona + 40 pts final)."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={columnasUnidades}
            dataSource={unidades}
            rowKey="IdUnidad"
            pagination={false}
            bordered
            size="small"
          />
        </>
      ) : (
        <Alert
          message="Sin Unidades"
          description="No se encontraron unidades para esta asignación."
          type="warning"
          showIcon
        />
      )}
    </Modal>
  );
};

export default VerAsignacionModal;

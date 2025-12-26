import React from 'react';
import { Modal, Descriptions, Tag } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, BookOutlined, IdcardOutlined } from '@ant-design/icons';

const VerDocenteModal = ({ visible, docente, onCancel }) => {
  if (!docente) return null;

  return (
    <Modal
      title={
        <span>
          <UserOutlined /> Detalles del Docente
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label={<span><IdcardOutlined /> ID Docente</span>}>
          {docente.idDocente}
        </Descriptions.Item>

        <Descriptions.Item label={<span><UserOutlined /> Nombre del Docente</span>}>
          <strong>{docente.NombreDocente || 'No especificado'}</strong>
        </Descriptions.Item>

        <Descriptions.Item label={<span><UserOutlined /> Nombre de Usuario</span>}>
          {docente.NombreUsuario || 'Sin usuario asociado'}
        </Descriptions.Item>

        <Descriptions.Item label={<span><MailOutlined /> Email</span>}>
          {docente.Email || 'No especificado'}
        </Descriptions.Item>

        <Descriptions.Item label={<span><PhoneOutlined /> Teléfono</span>}>
          {docente.Telefono || 'No especificado'}
        </Descriptions.Item>

        <Descriptions.Item label={<span><BookOutlined /> Especialidad</span>}>
          {docente.Especialidad || 'No especificada'}
        </Descriptions.Item>

        <Descriptions.Item label="Estado">
          <Tag color={docente.Estado ? 'green' : 'red'} style={{ fontSize: '14px' }}>
            {docente.Estado ? 'ACTIVO' : 'INACTIVO'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label={<span><IdcardOutlined /> ID Usuario</span>}>
          {docente.idUsuario || 'No asignado'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default VerDocenteModal;

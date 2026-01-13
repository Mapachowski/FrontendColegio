import React from 'react';
import { Modal, Descriptions, Tag, Badge } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const VerUnidadModal = ({ visible, unidad, onCancel }) => {
  if (!unidad) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return dayjs(fecha).format('DD/MM/YYYY HH:mm');
  };

  return (
    <Modal
      title={
        <span>
          <Badge
            status={unidad.Activa === 1 ? 'processing' : 'default'}
            text={`Unidad ${unidad.NumeroUnidad} - ${unidad.NombreUnidad}`}
          />
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID Unidad">
          {unidad.IdUnidad}
        </Descriptions.Item>

        <Descriptions.Item label="ID Asignación Docente">
          {unidad.IdAsignacionDocente}
        </Descriptions.Item>

        <Descriptions.Item label="Número de Unidad">
          <strong>Unidad {unidad.NumeroUnidad}</strong>
        </Descriptions.Item>

        <Descriptions.Item label="Nombre">
          {unidad.NombreUnidad}
        </Descriptions.Item>

        <Descriptions.Item label="Configuración de Punteos">
          <div>
            <Tag color="blue" style={{ fontSize: '14px' }}>
              Zona: {parseFloat(unidad.PunteoZona)} pts
            </Tag>
            <Tag color="green" style={{ fontSize: '14px' }}>
              Examen Final: {parseFloat(unidad.PunteoFinal)} pts
            </Tag>
            <Tag color="purple" style={{ fontSize: '14px' }}>
              Total: {parseFloat(unidad.PunteoZona) + parseFloat(unidad.PunteoFinal)} pts
            </Tag>
          </div>
        </Descriptions.Item>

        <Descriptions.Item label="Estado de la Unidad">
          {unidad.Activa === 1 ? (
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: '14px' }}>
              ACTIVA (En curso)
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="default" style={{ fontSize: '14px' }}>
              CERRADA
            </Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Estado General">
          <Tag color={unidad.Estado === 1 ? 'green' : 'red'}>
            {unidad.Estado === 1 ? 'Activo' : 'Inactivo'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Creado Por">
          {unidad.CreadoPor || 'N/A'}
        </Descriptions.Item>

        <Descriptions.Item label="Fecha de Creación">
          {formatFecha(unidad.FechaCreado)}
        </Descriptions.Item>

        {unidad.ModificadoPor && (
          <>
            <Descriptions.Item label="Modificado Por">
              {unidad.ModificadoPor}
            </Descriptions.Item>

            <Descriptions.Item label="Fecha de Modificación">
              {formatFecha(unidad.FechaModificado)}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <p style={{ marginBottom: 8 }}>
          <strong>Información sobre unidades:</strong>
        </p>
        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
          <li>Las 4 unidades se crean automáticamente al asignar un docente a un curso</li>
          <li>Solo una unidad puede estar activa a la vez (la que está en curso)</li>
          <li>Los punteos se pueden configurar según las necesidades del curso</li>
          <li>La suma de Zona + Examen Final siempre debe ser 100 puntos</li>
        </ul>
      </div>
    </Modal>
  );
};

export default VerUnidadModal;

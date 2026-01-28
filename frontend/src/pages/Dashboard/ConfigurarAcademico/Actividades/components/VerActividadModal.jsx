import React from 'react';
import { Modal, Descriptions, Tag, Badge } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/es';

dayjs.extend(customParseFormat);
dayjs.locale('es');

const VerActividadModal = ({ visible, actividad, onCancel }) => {
  if (!actividad) return null;

  return (
    <Modal
      title="Detalles de la Actividad"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID Actividad">
          {actividad.IdActividad}
        </Descriptions.Item>

        <Descriptions.Item label="Nombre">
          <strong>{actividad.NombreActividad}</strong>
        </Descriptions.Item>

        <Descriptions.Item label="Descripción">
          {actividad.Descripcion || '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Tipo de Actividad">
          <Tag color={actividad.TipoActividad === 'zona' ? 'blue' : 'green'}>
            {actividad.TipoActividad === 'zona' ? 'Zona' : 'Final'}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Punteo Máximo">
          <Tag color="orange" style={{ fontSize: '14px' }}>
            {parseFloat(actividad.PunteoMaximo)} puntos
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Fecha de Actividad">
          {actividad.FechaActividad
            ? dayjs(actividad.FechaActividad, 'YYYY-MM-DD').format('dddd, D [de] MMMM [de] YYYY')
            : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Estado">
          {actividad.Estado ? (
            <Badge
              status="success"
              text={<Tag icon={<CheckCircleOutlined />} color="success">Activa</Tag>}
            />
          ) : (
            <Badge
              status="default"
              text={<Tag icon={<CloseCircleOutlined />} color="default">Inactiva</Tag>}
            />
          )}
        </Descriptions.Item>

        <Descriptions.Item label="ID Unidad">
          {actividad.IdUnidad}
        </Descriptions.Item>

        <Descriptions.Item label="Creado Por">
          Usuario ID: {actividad.CreadoPor}
        </Descriptions.Item>

        <Descriptions.Item label="Fecha de Creación">
          {actividad.FechaCreacion
            ? new Date(actividad.FechaCreacion).toLocaleString('es-GT')
            : '-'}
        </Descriptions.Item>

        {actividad.ModificadoPor && (
          <>
            <Descriptions.Item label="Modificado Por">
              Usuario ID: {actividad.ModificadoPor}
            </Descriptions.Item>

            <Descriptions.Item label="Fecha de Modificación">
              {actividad.FechaModificacion
                ? new Date(actividad.FechaModificacion).toLocaleString('es-GT')
                : '-'}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>
    </Modal>
  );
};

export default VerActividadModal;

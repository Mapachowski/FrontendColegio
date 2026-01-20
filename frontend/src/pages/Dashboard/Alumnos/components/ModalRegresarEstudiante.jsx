// src/pages/Dashboard/Alumnos/components/ModalRegresarEstudiante.jsx
import React from 'react';
import { Modal, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';

const ModalRegresarEstudiante = ({ visible, estudiante, onCancel, onSuccess }) => {
  const handleRegresar = async () => {
    try {
      // Obtener IdUsuario del localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const IdColaborador = user.IdUsuario;

      if (!IdColaborador) {
        message.error('No se pudo obtener el ID del colaborador');
        return;
      }

      // Realizar el PUT para actualizar el estado del alumno y su inscripción
      const response = await apiClient.put('/alumnos/regresar-estudiante', {
        IdAlumno: estudiante.IdAlumno,
        IdInscripcion: estudiante.IdInscripcion,
        IdColaborador: IdColaborador
      });

      if (response.data.success) {
        message.success(`${estudiante.Nombres} ${estudiante.Apellidos} ha sido regresado al sistema exitosamente`);
        onSuccess(); // Llamar al callback para recargar la lista
        onCancel(); // Cerrar el modal
      } else {
        message.error('Error al regresar el estudiante al sistema');
      }
    } catch (err) {
      if (err.response) {
      }
      message.error('Error al regresar el estudiante al sistema');
    }
  };

  if (!estudiante) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 22 }} />
          <span>¿Está seguro de regresar este estudiante al sistema?</span>
        </div>
      }
      open={visible}
      onOk={handleRegresar}
      onCancel={onCancel}
      okText="Sí, regresar al sistema"
      cancelText="Cancelar"
      okType="primary"
      width={500}
    >
      <div style={{ padding: '16px 0' }}>
        <p style={{ marginBottom: 8 }}>
          <strong>Estudiante:</strong> {estudiante.Nombres} {estudiante.Apellidos}
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>Carnet:</strong> {estudiante.IdAlumno}
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>Código MINEDUC:</strong> {estudiante.Matricula || '-'}
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>Grado:</strong> {estudiante.Grado} - {estudiante.Seccion}
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>Jornada:</strong> {estudiante.Jornada}
        </p>

        <div style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          borderRadius: 4
        }}>
          <p style={{ margin: 0, color: '#1890ff', fontSize: 14 }}>
            Esta acción reactivará al estudiante en el sistema y restaurará su inscripción.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ModalRegresarEstudiante;

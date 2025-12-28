import { useState } from 'react';
import { Modal, Form, Input, Button, message, Alert } from 'antd';
import { UnlockOutlined, WarningOutlined } from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';

const { TextArea } = Input;

const SolicitarReaperturaModal = ({ visible, onCancel, unidad, asignacion, idDocente, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    if (!unidad) {
      message.error('No se especificó la unidad');
      return;
    }

    if (!asignacion) {
      message.error('No se encontró la información de la asignación');
      return;
    }

    if (!idDocente) {
      message.error('No se pudo identificar al docente');
      return;
    }

    setLoading(true);
    try {
      // Puede ser IdAsignacionCursoDocente o IdAsignacionDocente dependiendo del backend
      const idAsignacion = asignacion.IdAsignacionCursoDocente || asignacion.IdAsignacionDocente;

      const payload = {
        IdUnidad: unidad.IdUnidad,
        IdAsignacionCursoDocente: idAsignacion,
        IdDocente: idDocente,
        Motivo: values.Motivo
      };

      console.log('Enviando solicitud de reapertura:', payload);
      console.log('Asignación completa:', asignacion);
      console.log('IdDocente:', idDocente);

      const response = await apiClient.post('/solicitudes-reapertura', payload);

      if (response.data.success) {
        message.success(response.data.message || 'Solicitud enviada al administrador');
        form.resetFields();
        onSuccess?.();
        onCancel();
      }
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
      const errorMsg = error.response?.data?.error || 'Error al enviar la solicitud de reapertura';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <UnlockOutlined /> Solicitar Reapertura de Unidad
        </span>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <h4>{unidad?.NombreUnidad}</h4>
        <p style={{ color: '#666', marginBottom: 8 }}>
          {asignacion?.NombreCurso} - {asignacion?.NombreGrado} {asignacion?.NombreSeccion}
        </p>
      </div>

      <Alert
        message="Importante"
        description={
          <div>
            <p>La solicitud de reapertura será revisada por un administrador.</p>
            <p style={{ marginBottom: 0 }}>
              Si se aprueba, podrás modificar las calificaciones de TODAS las actividades de esta unidad.
              Una vez realizadas las correcciones, deberás cerrar nuevamente la unidad.
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="Motivo"
          label="Motivo de la Solicitud"
          rules={[
            { required: true, message: 'Debes especificar el motivo de la reapertura' },
            { min: 20, message: 'El motivo debe tener al menos 20 caracteres' },
            { max: 500, message: 'El motivo no puede exceder 500 caracteres' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Ejemplo: Error en la calificación del examen final de varios alumnos. Necesito corregir los punteos..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => {
              form.resetFields();
              onCancel();
            }}>
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UnlockOutlined />}
            >
              Enviar Solicitud
            </Button>
          </div>
        </Form.Item>
      </Form>

      <Alert
        message="Nota"
        description="Puedes ver el estado de tus solicitudes en el menú 'Mis Solicitudes de Reapertura'."
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
};

export default SolicitarReaperturaModal;

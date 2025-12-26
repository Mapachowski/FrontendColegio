import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, Space, message, Alert } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';

const { Option } = Select;

const EditarAsignacionModal = ({ visible, asignacion, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState([]);

  useEffect(() => {
    if (visible && asignacion) {
      console.log('=== DEBUG EDITAR ASIGNACION ===');
      console.log('Asignacion recibida:', asignacion);
      console.log('IdDocente:', asignacion.IdDocente);
      console.log('================================');

      cargarDocentes();
      form.setFieldsValue({
        idDocente: asignacion.IdDocente // Cambiar a IdDocente con I mayúscula
      });
    } else {
      form.resetFields();
    }
  }, [visible, asignacion]);

  const cargarDocentes = async () => {
    try {
      const response = await apiClient.get('/docentes');
      if (response.data.success) {
        setDocentes(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error);
      message.error('Error al cargar docentes');
    }
  };

  const handleSubmit = async (values) => {
    const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
    const IdColaborador = user.IdUsuario;

    setLoading(true);
    try {
      // La API requiere TODOS los campos de la asignación
      const payload = {
        IdDocente: values.idDocente,
        IdCurso: asignacion.IdCurso,
        IdGrado: asignacion.IdGrado,
        IdSeccion: asignacion.IdSeccion,
        IdJornada: asignacion.IdJornada,
        Anio: asignacion.Anio,
        ModificadoPor: String(IdColaborador)
      };

      console.log('=== PAYLOAD EDITAR ASIGNACION ===');
      console.log('URL:', `/asignaciones/${asignacion.IdAsignacionDocente}`);
      console.log('Payload enviado:', payload);
      console.log('=================================');

      const response = await apiClient.put(
        `/asignaciones/${asignacion.IdAsignacionDocente}`,
        payload
      );

      console.log('Response:', response.data);

      if (response.data.success) {
        message.success({
          content: response.data.message || 'Docente actualizado exitosamente',
          duration: 8
        });
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.data.message || 'Error al actualizar asignación');
      }
    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      console.error('Error response:', error.response?.data);
      const mensajeError = error.response?.data?.message || 'Error al actualizar asignación';
      message.error(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  if (!asignacion) return null;

  return (
    <Modal
      title={
        <span>
          <SwapOutlined /> Cambiar Docente de Asignación
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={550}
      destroyOnClose
    >
      <div style={{
        background: '#fff7e6',
        border: '1px solid #ffd591',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <p><strong>Curso:</strong> {asignacion.NombreCurso}</p>
        <p><strong>Grado:</strong> {asignacion.NombreGrado}</p>
        <p><strong>Sección:</strong> {asignacion.NombreSeccion}</p>
        <p><strong>Jornada:</strong> {asignacion.NombreJornada}</p>
        <p style={{ marginBottom: 0 }}><strong>Año:</strong> {asignacion.Anio}</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="idDocente"
          label="Nuevo Docente"
          rules={[{ required: true, message: 'Por favor seleccione el docente' }]}
        >
          <Select
            placeholder="Seleccione el nuevo docente"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {docentes.map(doc => (
              <Option key={doc.idDocente} value={doc.idDocente}>
                {doc.NombreDocente}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Alert
          message="Información Importante"
          description="Solo se cambiará el docente asignado. El curso, grado, sección, jornada y año permanecerán igual. Las unidades y actividades ya creadas se mantendrán."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              Actualizar Docente
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditarAsignacionModal;

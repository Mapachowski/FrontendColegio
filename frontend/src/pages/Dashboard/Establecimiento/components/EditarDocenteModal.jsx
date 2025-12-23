import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, BookOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';

const EditarDocenteModal = ({ visible, docente, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && docente) {
      form.setFieldsValue({
        NombreDocente: docente.NombreDocente,
        Email: docente.Email,
        Telefono: docente.Telefono,
        Especialidad: docente.Especialidad,
      });
    }
  }, [visible, docente, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
      const IdUsuario = user.IdUsuario;

      const payload = {
        NombreDocente: values.NombreDocente,
        Email: values.Email,
        Telefono: values.Telefono,
        Especialidad: values.Especialidad,
        ModificadoPor: String(IdUsuario), // Convertir a string para evitar error .trim()
      };

      const response = await apiClient.put(`/docentes/${docente.idDocente}`, payload);

      if (response.data.success) {
        message.success('Docente actualizado exitosamente');
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error('Error al actualizar docente:', error);
      message.error(error.response?.data?.message || 'Error al actualizar el docente');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Editar Docente"
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Actualizar"
      cancelText="Cancelar"
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="NombreDocente"
          label="Nombre del Docente"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre del docente' },
            { min: 3, message: 'Mínimo 3 caracteres' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Ej: Prof. Juan Pérez"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="Email"
          label="Email"
          rules={[
            { type: 'email', message: 'Por favor ingrese un email válido' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="ejemplo@colegio.com"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="Telefono"
          label="Teléfono"
          rules={[
            { pattern: /^[0-9]{8}$/, message: 'El teléfono debe tener 8 dígitos' }
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="12345678"
            maxLength={8}
          />
        </Form.Item>

        <Form.Item
          name="Especialidad"
          label="Especialidad"
        >
          <Input
            prefix={<BookOutlined />}
            placeholder="Ej: Matemáticas, Lenguaje, etc."
            maxLength={100}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditarDocenteModal;

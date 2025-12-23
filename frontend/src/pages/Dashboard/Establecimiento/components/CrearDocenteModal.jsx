import React, { useState } from 'react';
import { Modal, Form, Input, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BookOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';

const CrearDocenteModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
      const IdColaborador = user.IdUsuario;

      // PASO 1: Crear usuario
      const usuarioPayload = {
        NombreUsuario: values.NombreUsuario,
        NombreCompleto: values.NombreCompleto,
        Contrasena: values.Contrasena,
        IdRol: 4, // Rol de Docente
        IdColaborador: IdColaborador,
      };

      const responseUsuario = await apiClient.post('/usuarios', usuarioPayload);

      if (!responseUsuario.data.success) {
        throw new Error('Error al crear el usuario');
      }

      const idUsuarioCreado = responseUsuario.data.data.IdUsuario;

      // PASO 2: Crear docente vinculado al usuario
      const docentePayload = {
        idUsuario: idUsuarioCreado,
        NombreDocente: values.NombreCompleto, // Usa el mismo nombre completo del usuario
        Email: values.Email,
        Telefono: values.Telefono,
        Especialidad: values.Especialidad,
        IdColaborador: IdColaborador,
        CreadoPor: String(IdColaborador), // Convertir a string para evitar error .trim()
      };

      const responseDocente = await apiClient.post('/docentes', docentePayload);

      if (responseDocente.data.success) {
        message.success('Docente y usuario creados exitosamente');
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error('Error al crear docente:', error);
      message.error(error.response?.data?.message || 'Error al crear el docente');
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
      title="Nuevo Docente"
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Guardar"
      cancelText="Cancelar"
      confirmLoading={loading}
      width={650}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Divider orientation="left">Datos del Usuario</Divider>

        <Form.Item
          name="NombreUsuario"
          label="Nombre de Usuario"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre de usuario' },
            { min: 4, message: 'Mínimo 4 caracteres' },
            { pattern: /^[a-zA-Z0-9._]+$/, message: 'Solo letras, números, puntos y guiones bajos' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Ej: juan.perez"
            maxLength={50}
          />
        </Form.Item>

        <Form.Item
          name="NombreCompleto"
          label="Nombre Completo"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre completo' },
            { min: 3, message: 'Mínimo 3 caracteres' }
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Ej: Juan Pérez García"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="Contrasena"
          label="Contraseña"
          rules={[
            { required: true, message: 'Por favor ingrese la contraseña' },
            { min: 6, message: 'Mínimo 6 caracteres' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Contraseña para el usuario"
          />
        </Form.Item>

        <Form.Item
          name="ConfirmarContrasena"
          label="Confirmar Contraseña"
          dependencies={['Contrasena']}
          rules={[
            { required: true, message: 'Por favor confirme la contraseña' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('Contrasena') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Las contraseñas no coinciden'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirme la contraseña"
          />
        </Form.Item>

        <Divider orientation="left">Datos del Docente</Divider>

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

export default CrearDocenteModal;

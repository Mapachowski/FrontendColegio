import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { BookOutlined, NumberOutlined, CodeOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';

const { Option } = Select;

const CrearCursoModal = ({ visible, grados, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        idGrado: values.idGrado,
        NoOrden: values.NoOrden,
        Curso: values.Curso,
        CodigoSire: values.CodigoSire || null, // Si está vacío, enviar null
      };

      const response = await apiClient.post('/cursos', payload);

      if (response.data.success) {
        message.success('Curso creado exitosamente');
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error('Error al crear curso:', error);
      message.error(error.response?.data?.message || 'Error al crear el curso');
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
      title="Nuevo Curso"
      open={visible}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Guardar"
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
          name="idGrado"
          label="Grado"
          rules={[
            { required: true, message: 'Por favor seleccione el grado' }
          ]}
        >
          <Select
            placeholder="Seleccione el grado"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {grados.map(grado => (
              <Option key={grado.IdGrado} value={grado.IdGrado}>
                {grado.NombreGrado}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="NoOrden"
          label="Número de Orden"
          rules={[
            { required: true, message: 'Por favor ingrese el número de orden' },
            { type: 'number', min: 1, message: 'Debe ser un número positivo' }
          ]}
        >
          <InputNumber
            prefix={<NumberOutlined />}
            placeholder="Ej: 1"
            style={{ width: '100%' }}
            min={1}
          />
        </Form.Item>

        <Form.Item
          name="Curso"
          label="Nombre del Curso"
          rules={[
            { required: true, message: 'Por favor ingrese el nombre del curso' },
            { min: 3, message: 'Mínimo 3 caracteres' }
          ]}
        >
          <Input
            prefix={<BookOutlined />}
            placeholder="Ej: Matemáticas"
            maxLength={100}
          />
        </Form.Item>

        <Form.Item
          name="CodigoSire"
          label="Código SIRE (opcional)"
          tooltip="Deje vacío si es un curso propio del colegio (Arte, Computación, etc.)"
        >
          <Input
            prefix={<CodeOutlined />}
            placeholder="Ej: MAT-001 (vacío si es curso propio)"
            maxLength={50}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CrearCursoModal;

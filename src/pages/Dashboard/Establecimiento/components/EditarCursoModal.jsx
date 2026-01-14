import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { BookOutlined, NumberOutlined, CodeOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';

const { Option } = Select;

const EditarCursoModal = ({ visible, curso, grados, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && curso) {
      form.setFieldsValue({
        idGrado: curso.idGrado,
        NoOrden: curso.NoOrden,
        Curso: curso.Curso,
        CodigoSire: curso.CodigoSire,
      });
    }
  }, [visible, curso, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        idGrado: values.idGrado,
        NoOrden: values.NoOrden,
        Curso: values.Curso,
        CodigoSire: values.CodigoSire || null, // Si está vacío, enviar null
      };

      const response = await apiClient.put(`/cursos/${curso.idCurso}`, payload);

      if (response.data.success) {
        message.success('Curso actualizado exitosamente');
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error('Error al actualizar curso:', error);
      message.error(error.response?.data?.message || 'Error al actualizar el curso');
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
      title="Editar Curso"
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

export default EditarCursoModal;

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';

const Docentes = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [docenteActual, setDocenteActual] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    cargarDocentes();
  }, []);

  const cargarDocentes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/docentes');
      if (response.data.success) {
        setDocentes(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error);
      message.error('Error al cargar la lista de docentes');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (docente = null) => {
    if (docente) {
      setEditando(true);
      setDocenteActual(docente);
      form.setFieldsValue(docente);
    } else {
      setEditando(false);
      setDocenteActual(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(false);
    setDocenteActual(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editando) {
        const response = await apiClient.put(`/docentes/${docenteActual.idDocente}`, values);
        if (response.data.success) {
          message.success('Docente actualizado exitosamente');
          cargarDocentes();
          cerrarModal();
        }
      } else {
        const response = await apiClient.post('/docentes', values);
        if (response.data.success) {
          message.success('Docente creado exitosamente');
          cargarDocentes();
          cerrarModal();
        }
      }
    } catch (error) {
      console.error('Error al guardar docente:', error);
      message.error(error.response?.data?.message || 'Error al guardar docente');
    }
  };

  const handleEliminar = async (id) => {
    try {
      const response = await apiClient.delete(`/docentes/${id}`);
      if (response.data.success) {
        message.success('Docente eliminado exitosamente');
        cargarDocentes();
      }
    } catch (error) {
      console.error('Error al eliminar docente:', error);
      message.error('Error al eliminar docente');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'idDocente',
      key: 'idDocente',
      width: 80,
      sorter: (a, b) => a.idDocente - b.idDocente,
    },
    {
      title: 'Nombres',
      dataIndex: 'Nombres',
      key: 'Nombres',
      sorter: (a, b) => a.Nombres.localeCompare(b.Nombres),
    },
    {
      title: 'Apellidos',
      dataIndex: 'Apellidos',
      key: 'Apellidos',
      sorter: (a, b) => a.Apellidos.localeCompare(b.Apellidos),
    },
    {
      title: 'DPI',
      dataIndex: 'DPI',
      key: 'DPI',
    },
    {
      title: 'Teléfono',
      dataIndex: 'Telefono',
      key: 'Telefono',
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
    },
    {
      title: 'Dirección',
      dataIndex: 'Direccion',
      key: 'Direccion',
      ellipsis: true,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => abrirModal(record)}
          />
          <Popconfirm
            title="¿Está seguro de eliminar este docente?"
            onConfirm={() => handleEliminar(record.idDocente)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          <UserOutlined /> Gestión de Docentes
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => abrirModal()}
        >
          Nuevo Docente
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={docentes}
        rowKey="idDocente"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} docentes`,
        }}
        bordered
      />

      <Modal
        title={editando ? 'Editar Docente' : 'Nuevo Docente'}
        open={modalVisible}
        onCancel={cerrarModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="Nombres"
            label="Nombres"
            rules={[{ required: true, message: 'Por favor ingrese los nombres' }]}
          >
            <Input placeholder="Ingrese los nombres" />
          </Form.Item>

          <Form.Item
            name="Apellidos"
            label="Apellidos"
            rules={[{ required: true, message: 'Por favor ingrese los apellidos' }]}
          >
            <Input placeholder="Ingrese los apellidos" />
          </Form.Item>

          <Form.Item
            name="DPI"
            label="DPI"
            rules={[
              { pattern: /^[0-9]{13}$/, message: 'El DPI debe tener 13 dígitos' }
            ]}
          >
            <Input placeholder="Ingrese el DPI (13 dígitos)" maxLength={13} />
          </Form.Item>

          <Form.Item
            name="Telefono"
            label="Teléfono"
            rules={[
              { pattern: /^[0-9]{8}$/, message: 'El teléfono debe tener 8 dígitos' }
            ]}
          >
            <Input placeholder="Ingrese el teléfono (8 dígitos)" maxLength={8} />
          </Form.Item>

          <Form.Item
            name="Email"
            label="Email"
            rules={[
              { type: 'email', message: 'Por favor ingrese un email válido' }
            ]}
          >
            <Input placeholder="Ingrese el email" />
          </Form.Item>

          <Form.Item
            name="Direccion"
            label="Dirección"
          >
            <Input.TextArea
              placeholder="Ingrese la dirección"
              rows={3}
              maxLength={45}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editando ? 'Actualizar' : 'Guardar'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Docentes;

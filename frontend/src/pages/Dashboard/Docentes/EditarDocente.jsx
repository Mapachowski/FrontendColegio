// src/pages/dashboard/Docentes/EditarDocente.jsx
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";

const EditarDocente = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const cargarDocente = async () => {
    try {
      const res = await apiClient.get(`/docentes/${id}`);
      form.setFieldsValue(res.data.data);
    } catch (err) {
      message.error("Error al cargar docente");
    }
  };

  useEffect(() => {
    cargarDocente();
  }, []);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      await apiClient.put(`/docentes/${id}`, {
        ...values,
        ModificadoPor: "F15",
      });

      message.success("Docente actualizado");
      navigate("/dashboard/docentes");
    } catch (error) {
      message.error("Error al actualizar docente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Editar Docente">
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item label="Nombres" name="Nombres" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Apellidos" name="Apellidos" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="DPI" name="DPI" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Telefono" name="Telefono">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="Email">
          <Input />
        </Form.Item>

        <Form.Item label="Direccion" name="Direccion">
          <Input />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar Cambios
        </Button>

        <Button style={{ marginLeft: 10 }} onClick={() => navigate("/dashboard/docentes")}>
          Cancelar
        </Button>
      </Form>
    </Card>
  );
};

export default EditarDocente;

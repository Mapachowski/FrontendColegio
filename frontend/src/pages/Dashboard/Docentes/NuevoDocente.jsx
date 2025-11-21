// src/pages/dashboard/Docentes/NuevoDocente.jsx
import React, { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";

const NuevoDocente = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);

      await apiClient.post("/docentes", {
        ...values,
        CreadoPor: "F15",
      });

      message.success("Docente creado correctamente");
      navigate("/dashboard/docentes");
    } catch (error) {
      message.error("Error al crear docente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Nuevo Docente">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Nombres" name="Nombres" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Apellidos" name="Apellidos" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="DPI" name="DPI" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Teléfono" name="Telefono">
          <Input />
        </Form.Item>

        <Form.Item label="Email" name="Email">
          <Input type="email" />
        </Form.Item>

        <Form.Item label="Dirección" name="Direccion">
          <Input />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading}>
          Guardar
        </Button>

        <Button style={{ marginLeft: 10 }} onClick={() => navigate("/dashboard/docentes")}>
          Cancelar
        </Button>
      </Form>
    </Card>
  );
};

export default NuevoDocente;

// src/pages/dashboard/Docentes/Docentes.jsx

import React, { useEffect, useState } from "react";
import { Table, Button, Space, Tag, message } from "antd";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";

const Docentes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const cargarDocentes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/docentes");
      setData(response.data.data);
    } catch (error) {
      message.error("Error al cargar los docentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDocentes();
  }, []);

  const inactivar = async (id) => {
    try {
      await apiClient.delete(`/docentes/${id}`, {
        data: { ModificadoPor: "F15" },
      });
      message.success("Docente inactivado");
      cargarDocentes();
    } catch (error) {
      message.error("Error al inactivar docente");
    }
  };

  const columns = [
    { title: "Nombres", dataIndex: "Nombres" },
    { title: "Apellidos", dataIndex: "Apellidos" },
    { title: "DPI", dataIndex: "DPI" },
    { title: "Teléfono", dataIndex: "Telefono" },
    { title: "Email", dataIndex: "Email" },
    {
      title: "Estado",
      dataIndex: "Estado",
      render: (estado) =>
        estado === 1 ? (
          <Tag color="green">Activo</Tag>
        ) : (
          <Tag color="red">Inactivo</Tag>
        ),
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() =>
              navigate(`/dashboard/docentes/editar/${record.idDocente}`)
            }
          >
            Editar
          </Button>

          <Button danger onClick={() => inactivar(record.idDocente)}>
            Inactivar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Listado de Docentes</h2>

      <Button
        type="primary"
        style={{ marginBottom: 20 }}
        onClick={() => navigate("/dashboard/docentes/nuevo")}
      >
        Nuevo Docente
      </Button>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="idDocente"
        loading={loading}
      />
    </div>
  );
};

export default Docentes;

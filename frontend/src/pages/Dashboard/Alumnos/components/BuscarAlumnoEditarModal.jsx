// src/pages/dashboard/alumnos/components/BuscarAlumnoEditarModal.jsx
import React, { useState } from 'react';
import { Modal, Select, Button, Table, Spin } from 'antd';

const { Option } = Select;

const BuscarAlumnoEditarModal = ({ open, onCancel, onBuscar }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Datos de ejemplo para que veas la tabla
  const alumnosEjemplo = [
    { IdAlumno: 1001, Nombres: 'Juan Carlos', Apellidos: 'Pérez Gómez', Matricula: '2025-001' },
    { IdAlumno: 1002, Nombres: 'María Fernanda', Apellidos: 'López Ruiz', Matricula: '2025-002' },
    { IdAlumno: 1003, Nombres: 'Carlos Eduardo', Apellidos: 'Mendoza Díaz', Matricula: '2025-003' },
  ];

  const handleBuscar = () => {
    if (!selectedId) {
      alert('Por favor selecciona un alumno');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simulamos búsqueda
      setData([
        {
          IdAlumno: selectedId,
          Matricula: '2025-001',
          Nombres: 'Juan Carlos',
          Apellidos: 'Pérez Gómez',
          NombreGrado: 'Primero Primaria',
          NombreSeccion: 'A',
          NombreJornada: 'Matutina',
        }
      ]);
      setLoading(false);
    }, 800);
  };

  const columns = [
    { title: 'Matrícula', dataIndex: 'Matricula', width: 120 },
    { title: 'Nombres', dataIndex: 'Nombres', width: 180 },
    { title: 'Apellidos', dataIndex: 'Apellidos', width: 180 },
    { title: 'Grado', dataIndex: 'NombreGrado' },
    { title: 'Sección', dataIndex: 'NombreSeccion', width: 100 },
    { title: 'Jornada', dataIndex: 'NombreJornada', width: 120 },
  ];

  return (
    <Modal
      title="Buscar Alumno para Editar"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select
          showSearch
          placeholder="Escribe nombre o apellidos del alumno"
          style={{ width: 500 }}
          value={selectedId}
          onChange={setSelectedId}
          filterOption={(input, opt) =>
            opt.children.toLowerCase().includes(input.toLowerCase())
          }
        >
          {alumnosEjemplo.map(a => (
            <Option key={a.IdAlumno} value={a.IdAlumno}>
              {a.Nombres} {a.Apellidos} - {a.Matricula}
            </Option>
          ))}
        </Select>

        <Button
          type="primary"
          size="large"
          onClick={() => {
            handleBuscar();
            // Cuando presionas "Buscar", simulamos que ya encontramos y pasamos al formulario
            setTimeout(() => {
              onBuscar?.(); // Aquí le decimos al padre: "¡Ya buscamos! Muestra el formulario"
            }, 1000);
          }}
        >
          Buscar
        </Button>
      </div>

      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="IdAlumno"
          pagination={false}
          style={{ cursor: 'pointer' }}
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
          Selecciona un alumno y presiona "Buscar"
        </div>
      )}
    </Modal>
  );
};

export default BuscarAlumnoEditarModal;
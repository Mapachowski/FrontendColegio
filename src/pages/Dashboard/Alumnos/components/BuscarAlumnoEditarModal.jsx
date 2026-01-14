// src/pages/dashboard/alumnos/components/BuscarAlumnoEditarModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Button, Table, Spin, Input, message } from 'antd';
import apiClient from '../../../../api/apiClient';

const { Option } = Select;

const BuscarAlumnoEditarModal = ({ open, onCancel, onAlumnoSeleccionado }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [cicloEscolar, setCicloEscolar] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // Obtener ciclo actual automáticamente
  useEffect(() => {
    const obtenerCicloActual = () => {
      const hoy = new Date();
      const mes = hoy.getMonth();
      const año = hoy.getFullYear();
      // Si es noviembre o diciembre → siguiente año
      if (mes >= 10) {
        return (año + 1).toString();
      }
      return año.toString();
    };
    setCicloEscolar(obtenerCicloActual());
  }, []);

  // Cargar lista de alumnos para el Select
  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const res = await apiClient.get('/alumnos');
        const alumnosList = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAlumnos(alumnosList);
      } catch (error) {
        console.error('ERROR CARGANDO ALUMNOS:', error);
        message.error('Error al cargar la lista de alumnos');
      }
    };
    if (open) fetchAlumnos();
  }, [open]);

  const handleBuscar = async () => {
    if (!selectedId) {
      message.warning('Por favor selecciona un alumno');
      return;
    }

    if (!cicloEscolar) {
      message.warning('Por favor ingresa el ciclo escolar');
      return;
    }

    setLoading(true);
    try {
      const url = `/inscripciones/buscar-alumno?IdAlumno=${encodeURIComponent(selectedId)}&CicloEscolar=${encodeURIComponent(cicloEscolar)}`;
      const res = await apiClient.get(url);

      let finalData = [];
      if (res.data.success && res.data.data?.length > 0) {
        finalData = res.data.data
          .filter(item => item && item[0])
          .map(item => item[0]);
      }

      setData(finalData);

      if (finalData.length === 0) {
        message.info('No se encontró inscripción para este alumno en el ciclo seleccionado');
      }
    } catch (error) {
      console.error('ERROR AL BUSCAR:', error);
      message.error('Error al buscar alumno. Intenta nuevamente.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (record) => {
    // Pasar los datos completos al componente padre
    // No cerramos el modal aquí, lo hará el componente padre después de cargar todo
    await onAlumnoSeleccionado(record);
  };

  const columns = [
    { title: 'Carnet', dataIndex: 'IdAlumno', width: 100 },
    { title: 'Matrícula', dataIndex: 'Matricula', width: 120 },
    { title: 'Nombres', dataIndex: 'Nombres', width: 150 },
    { title: 'Apellidos', dataIndex: 'Apellidos', width: 150 },
    { title: 'Grado', dataIndex: 'NombreGrado', width: 150 },
    { title: 'Sección', dataIndex: 'NombreSeccion', width: 100 },
    { title: 'Jornada', dataIndex: 'NombreJornada', width: 120 },
  ];

  return (
    <Modal
      title="Buscar Alumno para Editar"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Select
          showSearch
          placeholder="Buscar alumno por nombre o apellido"
          style={{ width: 400 }}
          value={selectedId}
          onChange={setSelectedId}
          filterOption={(input, option) => {
            const label = String(option?.children || '').toLowerCase();
            return label.includes(input.toLowerCase());
          }}
          notFoundContent="No se encontraron alumnos"
        >
          {alumnos.map((a) => (
            <Option key={a.IdAlumno} value={a.IdAlumno}>
              {a.Nombres} {a.Apellidos} ({a.IdAlumno})
            </Option>
          ))}
        </Select>

        <Input
          placeholder="Ciclo Escolar"
          value={cicloEscolar}
          onChange={(e) => setCicloEscolar(e.target.value)}
          style={{ width: 120 }}
        />

        <Button
          type="primary"
          size="large"
          onClick={handleBuscar}
          disabled={!selectedId || !cicloEscolar}
        >
          Buscar
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Buscando alumno...</p>
        </div>
      ) : data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="IdAlumno"
          pagination={false}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 1000 }}
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
          Selecciona un alumno y ciclo escolar, luego presiona "Buscar"
        </div>
      )}
    </Modal>
  );
};

export default BuscarAlumnoEditarModal;
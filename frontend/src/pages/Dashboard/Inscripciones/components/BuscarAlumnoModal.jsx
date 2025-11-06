// src/pages/dashboard/Inscripciones/components/BuscarAlumnoModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Input, Table, Spin, Button } from 'antd';
import apiClient from '../../../../api/apiClient';


const { Option } = Select;

const BuscarAlumnoModal = ({ open, onCancel, state, dispatch }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [cicloEscolar, setCicloEscolar] = useState('2025');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // LOG 1: Carga de alumnos para el Select
  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        console.log('FETCH ALUMNOS PARA SELECT...');
        const res = await apiClient.get('/alumnos');
        console.log('RESPUESTA /alumnos:', res);
        console.log('res.data:', res.data);

        const alumnosList = Array.isArray(res.data) ? res.data : res.data.data || [];
        console.log('ALUMNOS FINALES (para Select):', alumnosList);

        setAlumnos(alumnosList);
      } catch (error) {
        console.error('ERROR CARGANDO ALUMNOS PARA SELECT:', error);
      }
    };
    if (open) fetchAlumnos();
  }, [open]);

  // LOG 2: Búsqueda del alumno en inscripción
  const handleBuscar = async () => {
    if (!selectedId) {
      console.warn('No hay IdAlumno seleccionado');
      return;
    }

    console.log('INICIANDO BÚSQUEDA...', { IdAlumno: selectedId, CicloEscolar: cicloEscolar });
    setLoading(true);

    try {
      const url = `/inscripciones/buscar-alumno?IdAlumno=${selectedId}&CicloEscolar=${cicloEscolar}`;
      console.log('URL completa:', url);

      const res = await apiClient.get(url);

      console.log('RESPUESTA COMPLETA DEL SP:', res);
      console.log('res.data.success:', res.data.success);
      console.log('res.data.data:', res.data.data);

      let finalData = [];

      if (res.data.success && res.data.data && res.data.data.length > 0) {
        // CORREGIR ESTRUCTURA: { "0": { datos } }
        finalData = res.data.data
          .filter(item => item && typeof item === 'object' && item[0])
          .map(item => item[0]);

        console.log('PRIMER REGISTRO CORREGIDO:', finalData[0]);
        console.log('Nombres:', finalData[0]?.Nombres);
        console.log('IdAlumno:', finalData[0]?.IdAlumno);
        console.log('Mensualidad:', finalData[0]?.Mensualidad);
      } else {
        console.warn('No hay datos válidos en res.data.data');
      }

      console.log('DATA FINAL PARA TABLA:', finalData);
      setData(finalData);

    } catch (error) {
      console.error('ERROR EN API /buscar-alumno:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };


const handleRowClick = (record) => {
  const actualRecord = record && record[0] ? record[0] : record;

  dispatch({
    type: 'UPDATE_ALUMNO',
    payload: {
      IdAlumno: actualRecord.IdAlumno,
      Carnet: actualRecord.IdAlumno,
      Matricula: actualRecord.Matricula,
      Nombres: actualRecord.Nombres,
      Apellidos: actualRecord.Apellidos,
      FechaNacimiento: actualRecord.FechaNacimiento,
      Genero: actualRecord.Genero,
      ComunidadLinguistica: actualRecord.ComunidadLinguistica,
      IdFamilia: actualRecord.IdFamilia,
    },
  });

  const gradoEncontrado = state.catalogos.grados.find(
    (g) => g.NombreGrado === actualRecord.NombreGrado
  );
  const familia = state.catalogos.familias.find(f => f.IdFamilia === record.IdFamilia);
    if (familia) {
      dispatch({
        type: 'UPDATE_PAGO',
        payload: {
          NombreRecibo: familia.NombreRecibo || '',
          DireccionRecibo: familia.DireccionRecibo || '',
        }
      });
    }

  dispatch({
    type: 'UPDATE_INSCRIPCION',
    payload: {
      IdGrado: actualRecord.IdGrado || null,
      IdSeccion: actualRecord.IdSeccion || null,
      IdJornada: actualRecord.IdJornada || null,
      Mensualidad: gradoEncontrado?.CostoMensual || parseFloat(actualRecord.Mensualidad) || 0,
    },
  });
  const primerPaso = state.modo === 'nuevo' ? 1 : 0;
  dispatch({ type: 'SET_PASO', payload: primerPaso });
  onCancel();
};

  // Columnas
  const columns = [
    { title: 'Carnet', dataIndex: 'IdAlumno', key: 'IdAlumno', width: 100 },
    { title: 'Matrícula', dataIndex: 'Matricula', key: 'Matricula', width: 120 },
    { title: 'Nombres', dataIndex: 'Nombres', key: 'Nombres', width: 150 },
    { title: 'Apellidos', dataIndex: 'Apellidos', key: 'Apellidos', width: 150 },
    { title: 'Grado', dataIndex: 'NombreGrado', key: 'NombreGrado', width: 130 },
    { title: 'Sección', dataIndex: 'NombreSeccion', key: 'NombreSeccion', width: 80 },
    { title: 'Jornada', dataIndex: 'NombreJornada', key: 'NombreJornada', width: 100 },
    { title: 'Familia', dataIndex: 'NombreFamilia', key: 'NombreFamilia', width: 200 },
    {
      title: 'Mensualidad',
      render: (_, record) => `Q ${parseFloat(record.Mensualidad || 0).toFixed(2)}`,
      key: 'Mensualidad',
      width: 100,
    },
  ];

  return (
    <Modal
      title="Re-inscribir Alumno"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1100}
    >
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Select
          showSearch
          placeholder="Buscar alumno por nombre"
          style={{ width: 320 }}
          onChange={setSelectedId}
          value={selectedId}
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

        <Button type="primary" onClick={handleBuscar} disabled={!selectedId}>
          Buscar
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => {
            const r = record && record[0] ? record[0] : record;
            return r.IdAlumno || `temp-${Math.random()}`;
          }}
          pagination={false}
          scroll={{ x: 1100 }}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
          locale={{ emptyText: 'No se encontraron resultados. Intente con otro alumno.' }}
        />
      )}
    </Modal>
  );
};

export default BuscarAlumnoModal;
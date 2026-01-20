// src/pages/dashboard/Inscripciones/components/BuscarAlumnoModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Input, Table, Spin, Button,message,Tag } from 'antd';
import apiClient from '../../../../api/apiClient';
import { getCicloActual, getCicloAnterior } from '../../../../utils/cicloEscolar';


const { Option } = Select;

const BuscarAlumnoModal = ({ open, onCancel, state, dispatch }) => {
  const [alumnos, setAlumnos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const cicloBusqueda = getCicloAnterior(); // 2025
  const [cicloEscolar, setCicloEscolar] = useState(getCicloAnterior()); // Valor por defecto
  const cicloActual = getCicloActual();     // 2026


  // LOG 1: Carga de alumnos para el Select
  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        const res = await apiClient.get('/alumnos');

        const alumnosList = Array.isArray(res.data) ? res.data : res.data.data || [];

        setAlumnos(alumnosList);
      } catch (error) {
      }
    };
    if (open) fetchAlumnos();
  }, [open]);

  const handleBuscar = async () => {
    if (!selectedId) return;

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

      // NUEVO: Validar si ya está inscrito en ciclo actual
    const promesas = finalData.map(async (alumno) => {
          try {
            const check = await apiClient.get(
              `/inscripciones/ya-inscrito?idAlumno=${encodeURIComponent(alumno.IdAlumno)}&ciclo=${encodeURIComponent(cicloActual)}`
            );
            alumno.yaInscrito = check.data.yaInscrito;
          } catch {
            alumno.yaInscrito = false;
          }
          return alumno;
      });

      const dataValidada = await Promise.all(promesas);
      setData(dataValidada);

    } catch (error) {
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
    {
      title: 'Estado',
      key: 'estado',
      width: 130,
      render: (_, record) => (
        record.yaInscrito ? 
          <Tag color="red" style={{ width: '100%', textAlign: 'center' }}>Ya inscrito</Tag> : 
          <Tag color="green" style={{ width: '100%', textAlign: 'center' }}>Disponible</Tag>
      ),
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
          onClick: () => {
            if (record.yaInscrito) {
              message.warning(`Este alumno ya está inscrito en el ciclo actual (${cicloActual})`);
              return;
            }
            handleRowClick(record);
          },
          style: {
            cursor: 'pointer',
            opacity: 1,
            background: 'white',
          },
        })}
          locale={{ emptyText: 'No se encontraron resultados. Intente con otro alumno.' }}
        />
      )}
    </Modal>
  );
};

export default BuscarAlumnoModal;
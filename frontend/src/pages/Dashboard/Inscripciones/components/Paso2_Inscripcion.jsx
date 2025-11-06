// src/pages/dashboard/Inscripciones/components/Paso2_Inscripcion.jsx
import React, { useEffect } from 'react';
import { Form, Select, Input, DatePicker, Button, message } from 'antd';
import moment from 'moment';
import apiClient from '../../../../api/apiClient';

const { Option } = Select;

const Paso2_Inscripcion = ({ state, dispatch }) => {
  const { alumno, inscripcion, catalogos } = state;

  // FECHA DE HOY
  useEffect(() => {
    if (!inscripcion.FechaInscripcion) {
      dispatch({
        type: 'UPDATE_INSCRIPCION',
        payload: { FechaInscripcion: moment().format('YYYY-MM-DD') },
      });
    }
  }, [inscripcion.FechaInscripcion, dispatch]);

  // CARGAR COSTO AUTOMÁTICO
  const handleGradoChange = async (IdGrado) => {
    if (!IdGrado) return;

    try {
      const res = await apiClient.get(`/grados/costo/${IdGrado}`);
      const costo = Number(res.data.costo || res.data.data || 0);
      dispatch({
        type: 'UPDATE_INSCRIPCION',
        payload: { Mensualidad: costo },
      });
    } catch (error) {
      console.error('Error al cargar costo:', error);
      message.error('Error al cargar costo');
    }
  };

  // GUARDAR SELECCIÓN DE GRADO Y CARGAR COSTO
  const onGradoSelect = (IdGrado) => {
    // 1. Guardar IdGrado en el state
    dispatch({
      type: 'UPDATE_INSCRIPCION',
      payload: { IdGrado },
    });

    // 2. Cargar costo
    handleGradoChange(IdGrado);
  };

  const handleNext = () => {
    if (!inscripcion.IdGrado || !inscripcion.IdSeccion || !inscripcion.IdJornada) {
      message.error('Seleccione grado, sección y jornada');
      return;
    }

    console.log('PASO 2 → PASO 3 (INSCRIPCIÓN):', {
      IdAlumno: alumno.IdAlumno || 'Pendiente',
      IdGrado: inscripcion.IdGrado,
      IdSeccion: inscripcion.IdSeccion,
      IdJornada: inscripcion.IdJornada,
      FechaInscripcion: inscripcion.FechaInscripcion,
      Mensualidad: Number(inscripcion.Mensualidad || 0).toFixed(2),
      CicloEscolar: '2026',
    });

    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <Form layout="vertical">
      {/* ALUMNO */}
      <Form.Item label="Alumno">
        <Input
          value={`${alumno.Nombres} ${alumno.Apellidos}`}
          readOnly
          style={{ color: '#003366', fontWeight: 'bold' }}
        />
      </Form.Item>

      {/* CARNET */}
      <Form.Item label="Carnet">
        <Input
          value={
            state.modo === 'reinscribir'
              ? (state.alumno.IdAlumno || 'No encontrado')
              : (state.siguienteCarnet || 'Cargando...')
          }
          readOnly
          style={{
            color: state.modo === 'reinscribir' ? '#003366' : '#d4380d',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        />
      </Form.Item>

      {/* GRADO */}
      <Form.Item label="Grado" required>
        <Select
          placeholder="Seleccione grado"
          value={inscripcion.IdGrado}
          onChange={onGradoSelect}
          showSearch
          optionFilterProp="children"
        >
          {catalogos.grados.map(g => (
            <Option key={g.IdGrado} value={g.IdGrado}>
              {g.NombreGrado} (Q {Number(g.CostoMensual || 0).toFixed(2)})
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* SECCIÓN */}
      <Form.Item label="Sección" required>
        <Select
          placeholder="Seleccione sección"
          value={inscripcion.IdSeccion}
          onChange={(value) =>
            dispatch({ type: 'UPDATE_INSCRIPCION', payload: { IdSeccion: value } })
          }
        >
          {catalogos.secciones.map(s => (
            <Option key={s.IdSeccion} value={s.IdSeccion}>
              {s.NombreSeccion}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* JORNADA */}
      <Form.Item label="Jornada" required>
        <Select
          placeholder="Seleccione jornada"
          value={inscripcion.IdJornada}
          onChange={(value) =>
            dispatch({ type: 'UPDATE_INSCRIPCION', payload: { IdJornada: value } })
          }
        >
          {catalogos.jornadas.map(j => (
            <Option key={j.IdJornada} value={j.IdJornada}>
              {j.NombreJornada}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* FECHA INSCRIPCIÓN */}
      <Form.Item label="Fecha de Inscripción">
        <DatePicker
          style={{ width: '100%' }}
          value={inscripcion.FechaInscripcion ? moment(inscripcion.FechaInscripcion) : null}
          onChange={(date) =>
            dispatch({
              type: 'UPDATE_INSCRIPCION',
              payload: { FechaInscripcion: date?.format('YYYY-MM-DD') },
            })
          }
          format="DD/MM/YYYY"
        />
      </Form.Item>

      {/* MENSUALIDAD */}
      <Form.Item label="Mensualidad (Enero)">
        <Input
          value={`Q ${Number(inscripcion.Mensualidad || 0).toFixed(2)}`}
          readOnly
          style={{ color: '#d4380d', fontWeight: 'bold' }}
        />
      </Form.Item>

      {/* BOTÓN SIGUIENTE */}
      <Form.Item>
        <Button type="primary" size="large" onClick={handleNext} style={{ width: '100%' }}>
          Siguiente
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Paso2_Inscripcion;
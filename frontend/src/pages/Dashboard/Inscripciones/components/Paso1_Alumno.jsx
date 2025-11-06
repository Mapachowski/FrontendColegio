// src/pages/dashboard/Inscripciones/components/Paso1_Alumno.jsx
import React, { useEffect, useState } from 'react';
import { Form, Input, DatePicker, Select, Button, Space, message } from 'antd';
import moment from 'moment';
import apiClient from '../../../../api/apiClient';

const { Option } = Select;

const Paso1_Alumno = ({ state, dispatch }) => {
  const { alumno, catalogos } = state;
  const [siguienteCarnet, setSiguienteCarnet] = useState(null);

  // CARGAR CARNET FUTURO
    useEffect(() => {
    const fetchCarnet = async () => {
      try {
        const res = await apiClient.get('/alumnos/siguiente-carnet');
        const carnet = res.data.siguienteCarnet || res.data.data || res.data;
        setSiguienteCarnet(carnet);
        dispatch({ type: 'SET_SIGUIENTE_CARNET', payload: carnet }); // ← GUARDAR
      } catch (error) {
        message.error('Error al cargar carnet');
      }
    };
    fetchCarnet();
  }, []);
  // EN Paso1_Alumno.jsx
    useEffect(() => {
      console.log('FECHA ACTUAL EN STATE:', alumno.FechaNacimiento);
    }, [alumno.FechaNacimiento]);

  const handleNext = () => {
    if (!alumno.Nombres || !alumno.Apellidos || !alumno.FechaNacimiento || !alumno.Genero || !alumno.IdFamilia) {
      message.error('Complete todos los campos requeridos');
      return;
    }
    // LOG COMPLETO DEL PAYLOAD
  console.log('PAYLOAD ALUMNO AL IR AL PASO 2:', {
    IdColaborador: state.user.IdColaborador,
    Matricula: alumno.Matricula || `MAT-${new Date().getFullYear()}-${siguienteCarnet}`,
    Nombres: alumno.Nombres,
    Apellidos: alumno.Apellidos,
    FechaNacimiento: alumno.FechaNacimiento,
    Genero: alumno.Genero,
    IdFamilia: alumno.IdFamilia,
    ComentarioEstado: "Inscrito sin observaciones",
    NumeroEmergencia: alumno.NumeroEmergencia || "",
    ComunidadLinguistica: alumno.ComunidadLinguistica || "28",
    CarnetFuturo: siguienteCarnet,
  });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <Form layout="vertical">
      {/* CARNET FUTURO */}
      {siguienteCarnet && (
        <Form.Item>
          <div style={{ padding: '10px 14px', background: '#e6f7ff', borderRadius: 8, fontWeight: 'bold', color: '#003366' }}>
            El carnet será: <span style={{ color: '#d4380d', fontSize: '18px' }}>{siguienteCarnet}</span>
          </div>
        </Form.Item>
      )}

      <Form.Item label="Codigo Mineduc">
        <Input
          placeholder="Ej: MAT-2025-001"
          value={alumno.Matricula}
          onChange={(e) => dispatch({ type: 'UPDATE_ALUMNO', payload: { Matricula: e.target.value } })}
        />
      </Form.Item>

      <Form.Item label="Nombres" required>
        <Input
          value={alumno.Nombres}
          onChange={(e) => dispatch({ type: 'UPDATE_ALUMNO', payload: { Nombres: e.target.value } })}
        />
      </Form.Item>

      <Form.Item label="Apellidos" required>
        <Input
          value={alumno.Apellidos}
          onChange={(e) => dispatch({ type: 'UPDATE_ALUMNO', payload: { Apellidos: e.target.value } })}
        />
      </Form.Item>

      <Form.Item label="Fecha de Nacimiento" required>
        <DatePicker
          style={{ width: '100%' }}
          value={alumno.FechaNacimiento ? moment(alumno.FechaNacimiento, 'YYYY-MM-DD') : null}
          onChange={(date) => {
            const formatted = date ? date.format('YYYY-MM-DD') : null;
            console.log('FECHA SELECCIONADA:', formatted);
            dispatch({ 
              type: 'UPDATE_ALUMNO', 
              payload: { FechaNacimiento: formatted }
            });
          }}
          format="DD/MM/YYYY"
          placeholder="DD/MM/AAAA"
          allowClear
        />

      </Form.Item>

      <Form.Item label="Género" required>
        <Select
          placeholder="Seleccione"
          value={alumno.Genero}
          onChange={(value) => dispatch({ type: 'UPDATE_ALUMNO', payload: { Genero: value } })}
        >
          <Option value="M">Masculino</Option>
          <Option value="F">Femenino</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Comunidad Lingüística">
        <Select
          placeholder="Seleccione"
          value={alumno.ComunidadLinguistica}
          onChange={(value) => dispatch({ type: 'UPDATE_ALUMNO', payload: { ComunidadLinguistica: value } })}
        >
          <Option value="Mam ">Mam </Option>
          <Option value="Ladino">Ladino</Option>
        </Select>
      </Form.Item>

      <Form.Item label="Familia" required>
        <Space.Compact style={{ width: '100%' }}>
          <Select
            placeholder="Familia seleccionada"
            value={alumno.IdFamilia}
            style={{ width: '80%' }}
            disabled
          >
            <Option value={alumno.IdFamilia}>
              {catalogos.familias.find(f => f.IdFamilia === alumno.IdFamilia)?.NombreFamilia || 'Ninguna'}
            </Option>
          </Select>
          <Button
            type="primary"
            onClick={() => dispatch({ type: 'OPEN_MODAL', payload: 'familia' })}
          >
            Familias
          </Button>
        </Space.Compact>
      </Form.Item>

      <Form.Item>
        <Button type="primary" size="large" onClick={handleNext} style={{ width: '100%' }}>
          Siguiente
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Paso1_Alumno;
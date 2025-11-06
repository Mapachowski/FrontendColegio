// src/pages/dashboard/Inscripciones/Inscripciones.jsx
import React from 'react';
import { Card, Steps, Button, Spin, message } from 'antd';
import moment from 'moment';
import { useInscripcionForm } from './hooks/useInscripcionForm';
import Paso1_Alumno from './components/Paso1_Alumno';
import Paso2_Inscripcion from './components/Paso2_Inscripcion';
import Paso3_Pago from './components/Paso3_Pago';
import PopUpInicial from './components/PopUpInicial';
import BuscarAlumnoModal from './components/BuscarAlumnoModal';
import FamiliaModal from './components/FamiliaModal';
import apiClient from '../../../api/apiClient';

const { Step } = Steps;

const Inscripciones = () => {
  const { state, dispatch } = useInscripcionForm();
  const { modales, paso, modo, loading } = state;

  // GENERAR RECIBO PDF
  const generarReciboPDF = (carnet, pago) => {
    const total = (
      (pago.pagarInscripcion ? 200 : 0) +
      (pago.pagarEnero ? Number(state.inscripcion.Mensualidad || 0) : 0)
    ).toFixed(2);

    const doc = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #003366; border-radius: 10px;">
        <h1 style="text-align: center; color: #003366;">COLEGIO Nueva Candelaria</h1>
        <p style="text-align: center; color: #666; font-size: 14px;">RECIBO OFICIAL DE INSCRIPCIÓN</p>
        <hr style="border: 1px solid #003366;">
        <table style="width: 100%; font-size: 15px;">
          <tr><td><strong>Carnet:</strong></td><td>${carnet}</td></tr>
          <tr><td><strong>Fecha:</strong></td><td>${moment().format('DD/MM/YYYY')}</td></tr>
          <tr><td><strong>Nombre:</strong></td><td>${pago.NombreRecibo || 'No especificado'}</td></tr>
          <tr><td><strong>Dirección:</strong></td><td>${pago.DireccionRecibo || 'No especificada'}</td></tr>
          ${pago.NumeroRecibo ? `<tr><td><strong>No. Recibo:</strong></td><td>${pago.NumeroRecibo}</td></tr>` : ''}
        </table>
        <div style="padding: 15px; background: #f0f8ff; text-align: center; border-radius: 8px;">
          <p style="margin: 0; font-size: 22px; font-weight: bold; color: #d4380d;">
            TOTAL: Q ${total}
          </p>
        </div>
        <p style="text-align: center; color: #666; margin-top: 30px;">Gracias por su confianza.</p>
      </div>
    `;

    const win = window.open('', '_blank');
    win.document.write(doc);
    win.document.close();
    win.print();

    setTimeout(() => {
      if (win && !win.closed) win.close();
    }, 5000);
  };
    const getCicloEscolar = () => {
      const hoy = new Date();
      const mes = hoy.getMonth(); // 0 = enero, 10 = noviembre
      const año = hoy.getFullYear();

      // Si es noviembre o diciembre → siguiente año
      if (mes >= 10) {
        return (año + 1).toString();
      }
      // Enero a octubre → año actual
      return año.toString();
    };

  // FINALIZAR INSCRIPCIÓN
  const handleFinalizar = async () => {
    console.log('INICIANDO FINALIZAR INSCRIPCIÓN...');
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      let IdAlumno = state.alumno.IdAlumno;

      // 1. CREAR ALUMNO (nuevo)
      if (state.modo === 'nuevo') {
        console.log('CREANDO ALUMNO:', state.alumno);
        const alumnoPayload = {
          IdColaborador: state.user.IdColaborador,
          Matricula: state.alumno.Matricula || `MAT-${new Date().getFullYear()}-${state.siguienteCarnet}`,
          Nombres: state.alumno.Nombres.trim(),
          Apellidos: state.alumno.Apellidos.trim(),
          FechaNacimiento: moment(state.alumno.FechaNacimiento).format('YYYY-MM-DD'),
          Genero: state.alumno.Genero,
          IdFamilia: state.alumno.IdFamilia,
          ComentarioEstado: "Inscrito sin observaciones",
          NumeroEmergencia: state.alumno.NumeroEmergencia || "",
          ComunidadLinguistica: state.alumno.ComunidadLinguistica || "28",
        };

        const res = await apiClient.post('/alumnos', alumnoPayload);
        IdAlumno = res.data.IdAlumno || res.data.data?.IdAlumno;
        console.log('ALUMNO CREADO → IdAlumno:', IdAlumno);
      }

      // 2. CREAR INSCRIPCIÓN
      console.log('CREANDO INSCRIPCIÓN:', { IdAlumno, ...state.inscripcion });
      const inscPayload = {
        IdColaborador: state.user.IdColaborador,
        IdAlumno,
        IdGrado: state.inscripcion.IdGrado,
        IdSeccion: state.inscripcion.IdSeccion,
        IdJornada: state.inscripcion.IdJornada,
        CicloEscolar: getCicloEscolar(),
        FechaInscripcion: state.inscripcion.FechaInscripcion,
        ComentarioEstado: "Inscrito sin observaciones",
      };

      const inscRes = await apiClient.post('/inscripciones', inscPayload);
      const IdInscripcion = inscRes.data.IdInscripcion || inscRes.data.data?.IdInscripcion;
      console.log('INSCRIPCIÓN CREADA → IdInscripcion:', IdInscripcion);

      // 3. CREAR PAGOS (CON LOGS DETALLADOS)
      const pagos = [];
      if (state.pago.pagarInscripcion) {
        const pagoInsc = {
          IdColaborador: state.user.IdColaborador,
          IdUsuario: state.user.IdColaborador,
          Fecha: moment().format('YYYY-MM-DD'),
          IdAlumno,
          IdTipoPago: 1,
          Concepto: "Inscripción",
          IdMetodoPago: 1,
          Monto: 200,
          NumeroRecibo: state.pago.NumeroRecibo || null,
          Estado: true,
          NombreRecibo: state.pago.NombreRecibo || null,
          DireccionRecibo: state.pago.DireccionRecibo || null,
        };
        console.log('PAGO INSCRIPCIÓN →', pagoInsc);
        pagos.push(pagoInsc);
      }

      if (state.pago.pagarEnero && Number(state.inscripcion.Mensualidad) > 0) {
        const pagoEnero = {
          IdColaborador: state.user.IdColaborador,
          IdUsuario: state.user.IdColaborador,
          Fecha: moment().format('YYYY-MM-DD'),
          IdAlumno,
          IdTipoPago: 2,
          Concepto: "Enero",
          IdMetodoPago: 1,
          Monto: Number(state.inscripcion.Mensualidad),
          NumeroRecibo: state.pago.NumeroRecibo || null,
          Estado: true,
          NombreRecibo: state.pago.NombreRecibo || null,
          DireccionRecibo: state.pago.DireccionRecibo || null,
        };
        console.log('PAGO ENERO →', pagoEnero);
        pagos.push(pagoEnero);
      }

      if (pagos.length > 0) {
        console.log('ENVIANDO PAGOS AL BACKEND...');
        const resultados = await Promise.all(
          pagos.map(async (pago) => {
            try {
              const res = await apiClient.post('/pagos', pago);
              console.log('PAGO CREADO:', res.data);
              return res.data;
            } catch (err) {
              console.error('ERROR EN PAGO:', pago.Concepto, err.response?.data || err.message);
              throw err;
            }
          })
        );
        console.log('TODOS LOS PAGOS CREADOS:', resultados);
      } else {
        console.log('NO HAY PAGOS PARA CREAR');
      }

      // ÉXITO
      message.success(`¡Inscripción completada! Carnet: ${IdAlumno}`, 5);
      generarReciboPDF(IdAlumno, state.pago);

      // MOSTRAR BOTÓN NUEVA INSCRIPCIÓN
      dispatch({ type: 'SET_MOSTRAR_NUEVA', payload: true });

      // RESETEAR DESPUÉS DE 3 SEGUNDOS
      setTimeout(() => {
        dispatch({ type: 'RESET' });
        dispatch({ type: 'SET_MOSTRAR_NUEVA', payload: false });
      }, 3000);

      // RESETEAR DESPUÉS
      setTimeout(() => {
        dispatch({ type: 'RESET' });
      }, 2000);


    } catch (error) {
      console.error('ERROR FINAL:', error.response?.data || error.message);
      message.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // PASOS
const steps = [
  ...(modo === 'nuevo'
    ? [{
        title: 'Información del Alumno',
        content: <Paso1_Alumno state={state} dispatch={dispatch} />
      }]
    : []
  ),
  {
    title: 'Datos de Inscripción',
    content: <Paso2_Inscripcion state={state} dispatch={dispatch} />
  },
  {
    title: 'Pago de Inscripción y Enero',
    content: <Paso3_Pago state={state} dispatch={dispatch} onFinalizar={handleFinalizar} />
  },
];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h2>Inscripción de Alumno</h2>

      {/* SPINNER DE CARGA */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, fontSize: 18, color: '#003366' }}>
            Procesando inscripción...
          </p>
        </div>
      )}

      <PopUpInicial
        open={!modo}
        onOk={(value) => {
          dispatch({ type: 'SET_MODO', payload: value });
          if (value === 'reinscribir') {
            dispatch({ type: 'OPEN_MODAL', payload: 'buscarAlumno' });
          }
        }}
      />

      <BuscarAlumnoModal
        open={modales.buscarAlumno}
        state={state}
        dispatch={dispatch}
        onCancel={() => dispatch({ type: 'CLOSE_MODAL', payload: 'buscarAlumno' })}
      />

      <FamiliaModal
        open={modales.familia}
        state={state}
        dispatch={dispatch}
        onSelect={(familia) => {
          dispatch({ type: 'UPDATE_ALUMNO', payload: { IdFamilia: familia.IdFamilia } });
          dispatch({
            type: 'UPDATE_PAGO',
            payload: {
              NombreRecibo: familia.NombreRecibo || '',
              DireccionRecibo: familia.DireccionRecibo || '',
            }
          });
          dispatch({ type: 'CLOSE_MODAL', payload: 'familia' });
        }}
        onCancel={() => dispatch({ type: 'CLOSE_MODAL', payload: 'familia' })}
      />

      {modo && steps.length > 0 && (
        <>
          <Steps current={paso} style={{ marginBottom: 24 }}>
            {steps.map((item) => (
              <Step key={item.title} title={item.title} />
            ))}
          </Steps>

          <Card>{steps[paso]?.content}</Card>

          {state.mostrarNuevaInscripcion && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  dispatch({ type: 'RESET' });
                  dispatch({ type: 'SET_MOSTRAR_NUEVA', payload: false });
                }}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                NUEVA INSCRIPCIÓN
              </Button>
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            {paso > 0 && (
              <Button onClick={() => dispatch({ type: 'PREV_STEP' })}>Atrás</Button>
            )}
            {paso < steps.length - 1 && (
              <Button type="primary" onClick={() => dispatch({ type: 'NEXT_STEP' })}>
                Siguiente
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Inscripciones;
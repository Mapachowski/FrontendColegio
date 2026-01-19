// src/pages/dashboard/Inscripciones/Inscripciones.jsx
import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { escapeHTML } from '../../../utils/sanitize';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarBitacora } from '../../../utils/bitacora';

const { Step } = Steps;

const Inscripciones = () => {
  const { state, dispatch } = useInscripcionForm();
  const { modales, paso, modo, loading } = state;
  const [isModalOpen, setIsModalOpen] = useState(true);


  const handleOk = (tipo) => {
    console.log('Tipo seleccionado:', tipo);
    setIsModalOpen(false); // Cerramos al hacer OK
    // Aquí puedes redirigir o abrir otro formulario
  };

  const handleCancel = () => {
    setIsModalOpen(false); // Cerramos al cancelar o con la X
  };
  const generarReciboPDF = (carnet, pago, total, esMecanografia = false) => {
    // Sanitizar todos los datos del usuario para prevenir XSS
    const numeroRecibo = esMecanografia
      ? escapeHTML(pago.NumeroReciboMecanografia || 'MEC-SIN-NUM')
      : escapeHTML(pago.NumeroRecibo || 'SIN-NUM');

    const titulo = esMecanografia
      ? 'RECIBO OFICIAL - MECANOGRAFÍA'
      : 'RECIBO OFICIAL DE INSCRIPCIÓN';

    const color = esMecanografia ? '#d4380d' : '#003366';

    // Sanitizar todos los valores que vienen del usuario
    const carnetSafe = escapeHTML(String(carnet));
    const nombreSafe = escapeHTML(pago.NombreRecibo || 'No especificado');
    const direccionSafe = escapeHTML(pago.DireccionRecibo || 'No especificada');
    const totalSafe = escapeHTML(String(total));

    const doc = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid ${color}; border-radius: 10px;">
        <h1 style="text-align: center; color: ${color};">COLEGIO Nueva Candelaria</h1>
        <p style="text-align: center; color: #666; font-size: 14px;">${titulo}</p>
        <hr style="border: 1px solid ${color};">
        <table style="width: 100%; font-size: 15px;">
          <tr><td><strong>Carnet:</strong></td><td>${carnetSafe}</td></tr>
          <tr><td><strong>Fecha:</strong></td><td>${moment().format('DD/MM/YYYY')}</td></tr>
          <tr><td><strong>Nombre:</strong></td><td>${nombreSafe}</td></tr>
          <tr><td><strong>Dirección:</strong></td><td>${direccionSafe}</td></tr>
          <tr><td><strong>No. Recibo:</strong></td><td>${numeroRecibo}</td></tr>
        </table>
        <div style="padding: 15px; background: #f0f8ff; text-align: center; border-radius: 8px;">
          <p style="margin: 0; font-size: 22px; font-weight: bold; color: #d4380d;">
            TOTAL: Q ${totalSafe}
          </p>
        </div>
        <p style="text-align: center; color: #666; margin-top: 30px;">Gracias por su confianza.</p>
      </div>
    `;

    // Fallback seguro para window.open
    let win;
    try {
      win = window.open('', '_blank', 'width=800,height=600');
      if (!win) throw new Error('Popup bloqueado');
    } catch (e) {
      message.error('No se pudo abrir la ventana. Permite popups o usa Ctrl+P');
      return;
    }

    win.document.write(doc);
    win.document.close();
    win.focus();

    // Imprimir y cerrar
    win.print();

    setTimeout(() => {
      if (win && !win.closed) win.close();
    }, 1000);
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
  const extraerMonto = (response) => {
    const data = response?.data?.data || response?.data;
    const monto = data?.Monto;
    return monto ? parseFloat(monto) : 0;
  };
  const navigate = useNavigate();
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

        // 1.1. CREAR USUARIO DEL ESTUDIANTE
        try {
          const nombreCompleto = `${state.alumno.Nombres.trim()} ${state.alumno.Apellidos.trim()}`;
          const usuarioEstudiantePayload = {
            NombreUsuario: String(IdAlumno),
            NombreCompleto: nombreCompleto,
            Contrasena: String(IdAlumno),
            IdRol: 5, // Rol de estudiante
            IdColaborador: state.user.IdColaborador
          };

          console.log('=== CREANDO USUARIO ESTUDIANTE ===');
          console.log('Payload:', usuarioEstudiantePayload);

          const usuarioRes = await apiClient.post('/usuarios', usuarioEstudiantePayload);
          console.log('Response usuario:', usuarioRes.data);

          // Capturar IdUsuario de la respuesta
          const IdUsuario = usuarioRes.data.IdUsuario || usuarioRes.data.data?.IdUsuario;
          console.log('✅ Usuario del estudiante creado → IdUsuario:', IdUsuario);

          // 1.2. ACTUALIZAR ALUMNO CON EL IdUsuario
          if (IdUsuario) {
            try {
              console.log('=== ACTUALIZANDO ALUMNO CON IdUsuario ===');
              await apiClient.put(`/alumnos/${IdAlumno}`, {
                IdColaborador: state.user.IdColaborador, // Campo obligatorio
                IdUsuario: IdUsuario
              });
              console.log('✅ Alumno actualizado con IdUsuario');
            } catch (errorUpdate) {
              console.error('❌ Error al actualizar alumno con IdUsuario:', errorUpdate);
              console.error('Response:', errorUpdate.response?.data);
              message.warning('Usuario creado, pero no se pudo vincular al alumno');
            }
          } else {
            console.warn('⚠️ No se pudo obtener IdUsuario de la respuesta');
          }
        } catch (errorUsuario) {
          console.error('❌ Error al crear usuario del estudiante:', errorUsuario);
          console.error('Response:', errorUsuario.response?.data);
          // No bloqueamos la inscripción si falla la creación del usuario
          message.warning('Estudiante creado, pero hubo un error al crear su usuario de acceso');
        }
      }

      // 2. CREAR INSCRIPCIÓN
      console.log('CREANDO INSCRIPCIÓN:', { IdAlumno, ...state.inscripcion });
      const inscPayload = {
        IdColaborador: state.user.IdColaborador,
        IdAlumno,
        IdGrado: state.inscripcion.IdGrado,
        IdSeccion: state.inscripcion.IdSeccion,
        IdJornada: state.inscripcion.IdJornada,
        FechaInscripcion: state.inscripcion.FechaInscripcion,
        Mensualidad: state.inscripcion.Mensualidad,
        CicloEscolar: '2026',
      };

      const inscRes = await apiClient.post('/inscripciones', inscPayload);
      console.log('INSCRIPCIÓN CREADA:', inscRes.data);

      // Obtener IdInscripcion de la respuesta
      const IdInscripcion = inscRes.data.IdInscripcion || inscRes.data.data?.IdInscripcion;
      console.log('IdInscripcion obtenido:', IdInscripcion);

      // 2.1. ASIGNAR ACTIVIDADES AL ALUMNO (proceso invisible)
      // Este proceso crea las calificaciones para el alumno si ya existen actividades creadas
      if (IdInscripcion) {
        try {
          console.log('=== ASIGNANDO ACTIVIDADES AL ALUMNO (PROCESO AUTOMÁTICO) ===');
          console.log('Payload asignar-actividades:', {
            IdInscripcion: IdInscripcion,
            IdColaborador: state.user.IdColaborador
          });

          const asignarActividadesRes = await apiClient.post('/inscripciones/asignar-actividades', {
            IdInscripcion: IdInscripcion,
            IdColaborador: state.user.IdColaborador
          });

          console.log('📚 Respuesta asignar-actividades:', asignarActividadesRes.data);

          if (asignarActividadesRes.data.success) {
            const { actividadesEncontradas, calificacionesCreadas } = asignarActividadesRes.data.data || {};
            console.log(`✅ Actividades encontradas: ${actividadesEncontradas}`);
            console.log(`✅ Calificaciones creadas: ${calificacionesCreadas}`);
            console.log(`✅ Mensaje: ${asignarActividadesRes.data.message}`);
          }
          console.log('=== FIN ASIGNAR ACTIVIDADES ===');
        } catch (errorActividades) {
          // No bloqueamos la inscripción si falla la asignación de actividades
          console.error('❌ Error al asignar actividades (no crítico):', errorActividades);
          console.error('Response:', errorActividades.response?.data);
          // No mostramos mensaje al usuario, es un proceso interno
        }
      } else {
        console.warn('⚠️ No se pudo obtener IdInscripcion, no se asignarán actividades');
      }

      // 3. CREAR PAGOS SI SELECCIONADOS (solo si NO es inscripción sin pagos)
      const fechaHoy = moment().format('YYYY-MM-DD');
      const esPrimeroBasico = state.inscripcion.IdGrado === 7;
      const pagosCreados = [];

      // Si NO es inscripción sin pagos, crear los pagos seleccionados
      if (!state.pago.sinPagos) {
        // Pago Inscripción
        if (state.pago.pagarInscripcion) {
          const pagoInsc = await apiClient.post('/pagos', {
            IdColaborador: state.user.IdColaborador,
            IdUsuario: state.user.IdColaborador,
            Fecha: fechaHoy,
            IdAlumno,
            IdTipoPago: 3, // Asumiendo IdTipoPago para Inscripción
            Concepto: 'Inscripción',
            IdMetodoPago: 1, // Default o del form si se agrega
            Monto: state.inscripcion.ValorInscripcion,
            NumeroRecibo: state.pago.NumeroRecibo,
            NombreRecibo: state.pago.NombreRecibo,
            DireccionRecibo: state.pago.DireccionRecibo,
            Anio: getCicloActual(),
          });
          pagosCreados.push({ Monto: extraerMonto(pagoInsc) });
        }

        // Pago Enero
        if (state.pago.pagarEnero) {
          const pagoEnero = await apiClient.post('/pagos', {
            IdColaborador: state.user.IdColaborador,
            IdUsuario: state.user.IdColaborador,
            Fecha: fechaHoy,
            IdAlumno,
            IdTipoPago: 2,
            Concepto: 'Enero',
            IdMetodoPago: 1,
            Monto: state.inscripcion.Mensualidad,
            NumeroRecibo: state.pago.NumeroRecibo,
            NombreRecibo: state.pago.NombreRecibo,
            DireccionRecibo: state.pago.DireccionRecibo,
            Anio: getCicloActual(),
          });
          pagosCreados.push({ Monto: extraerMonto(pagoEnero) });
        }

        // PAGOS EXTRAS PARA PRIMERO BÁSICO
        if (esPrimeroBasico) {
          if (state.pago.pagarMecanografiaInsc) {
            const pagoMecInsc = await apiClient.post('/pagos', {
              IdColaborador: state.user.IdColaborador,
              IdUsuario: state.user.IdColaborador,
              Fecha: fechaHoy,
              IdAlumno,
              IdTipoPago: 4,
              Concepto: 'Inscripción Mecanografía',
              IdMetodoPago: 1,
              Monto: 40,
              NumeroRecibo: state.pago.NumeroReciboMecanografia || state.pago.NumeroRecibo,
              NombreRecibo: state.pago.NombreRecibo,
              DireccionRecibo: state.pago.DireccionRecibo,
              Anio: getCicloActual(),
            });
            pagosCreados.push({ Monto: extraerMonto(pagoMecInsc) });
          }

          if (state.pago.pagarMecanografiaEnero) {
            const pagoMecEnero = await apiClient.post('/pagos', {
              IdColaborador: state.user.IdColaborador,
              IdUsuario: state.user.IdColaborador,
              Fecha: fechaHoy,
              IdAlumno,
              IdTipoPago: 3,
              Concepto: 'Enero',
              IdMetodoPago: 1,
              Monto: 40,
              NumeroRecibo: state.pago.NumeroReciboMecanografia || state.pago.NumeroRecibo,
              NombreRecibo: state.pago.NombreRecibo,
              DireccionRecibo: state.pago.DireccionRecibo,
              Anio: getCicloActual(),
            });
            pagosCreados.push({ Monto: extraerMonto(pagoMecEnero) });
          }
        }

        console.log('PAGOS CREADOS:', pagosCreados);
      } else {
        console.log('INSCRIPCIÓN SIN PAGOS - No se crearon pagos');
      }

      // Registrar en bitácora la creación del alumno
      await registrarBitacora(
        'Creación de Alumno',
        `Alumno ID: ${IdAlumno} - ${state.alumno.Nombres} ${state.alumno.Apellidos}${state.pago.sinPagos ? ' (Sin pagos - pago diferido)' : ''}`
      );

      // Mensaje de éxito según el tipo de inscripción
      if (state.pago.sinPagos) {
        message.success('Inscripción completada sin pagos. El alumno deberá pagar al final del ciclo escolar.');
      } else {
        message.success('Inscripción completada con éxito');
      }

      // Solo generar recibos si hay pagos
      if (!state.pago.sinPagos) {
        // === RECIBO 1: INSCRIPCIÓN + ENERO (NORMAL) ===
        const totalNormal = (
          (state.pago.pagarInscripcion ? parseFloat(state.inscripcion.ValorInscripcion || 0) : 0) +
          (state.pago.pagarEnero ? parseFloat(state.inscripcion.Mensualidad || 0) : 0)
        ).toFixed(2);

        if (parseFloat(totalNormal) > 0) {
          generarReciboPDF(IdAlumno, state.pago, totalNormal, false);
        }

        // === RECIBO 2: MECANOGRAFÍA (SOLO UNO) ===
        const totalMecanografia = (
          (state.pago.pagarMecanografiaInsc ? 40 : 0) +
          (state.pago.pagarMecanografiaEnero ? 40 : 0)
        ).toFixed(2);

        if (parseFloat(totalMecanografia) > 0) {
          setTimeout(() => {
            generarReciboPDF(IdAlumno, state.pago, totalMecanografia, true);
          }, 1500); // Espera para que se imprima el primero
        }
      }

      navigate('/dashboard');

    } catch (error) {
      console.error('ERROR FINAL:', error.response?.data || error.message);
      // Sanitizar mensaje de error del servidor para prevenir XSS
      const errorMsg = escapeHTML(error.response?.data?.message || error.message);
      message.error(`Error: ${errorMsg}`);
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
        dispatch={dispatch}  // ← ¡AÑADE ESTO!
        onOk={(value) => {
          dispatch({ type: 'SET_MODO', payload: value });

          if (value === 'reinscribir') {
            dispatch({ type: 'OPEN_MODAL', payload: 'buscarAlumno' });
          }
        }}
        onCancel={() => {
          // Opcional: cerrar sin hacer nada
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
                onClick={async () => {
                  // 1. Resetear todo
                  dispatch({ type: 'RESET' });
                  dispatch({ type: 'SET_MOSTRAR_NUEVA', payload: false });

                  // 2. Forzar recarga de catálogos
                  dispatch({ type: 'SET_CATALOGOS' });
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
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button 
              type="default" 
              size="large"
              onClick={() => {
                 navigate('/dashboard');
              }}
            >
              Salir al Dashboard
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Inscripciones;
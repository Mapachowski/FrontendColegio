// src/pages/dashboard/Inscripciones/hooks/useInscripcionForm.js
import { useReducer, useEffect } from 'react';
import apiClient from '../../../../api/apiClient'; // Ajusta la ruta

// Función para obtener IdColaborador del localStorage de forma segura
const getIdColaborador = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.IdUsuario || null;
  } catch (error) {
    console.error('Error al obtener usuario del localStorage:', error);
    return null;
  }
};

const initialState = {
  paso: 0,
  modo: null,
  showInitialPopup: true,
  user: { IdColaborador: getIdColaborador() },
  alumno: {
    Carnet: '',
    Matricula: '',
    Nombres: '',
    Apellidos: '',
    FechaNacimiento: null,
    Genero: '',
    ComunidadLinguistica: '',
    IdFamilia: null,
  },
  inscripcion: {
    IdGrado: null,
    IdSeccion: null,
    IdJornada: null,
    FechaInscripcion: null,
    Mensualidad: 0,
  },
  pago: {
    pagarInscripcion: true,
    pagarEnero: true,
    NumeroRecibo: '',
    NombreRecibo: '',
    DireccionRecibo: '',
    sinPagos: false, // Para alumnos que pagarán todo el ciclo al final del año
  },
  pagos: [
    { IdTipoPago: 1, Concepto: 'Inscripción', Monto: 0, Pagado: false },
    { IdTipoPago: 2, Concepto: 'Mensualidad', Monto: 0, Pagado: false },
    { IdTipoPago: 4, Concepto: 'Inscripción Mecanografía', Monto: 0, Pagado: false },
    { IdTipoPago: 3, Concepto: 'Mensualidad Mecanografía', Monto: 0, Pagado: false },
  ],
  catalogos: {
    grados: [],
    secciones: [],
    jornadas: [],
    familias: [],
  },
  loading: false,
  mostrarNuevaInscripcion: false,
  modales: {
    buscarAlumno: false,
    familia: false,
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODO':
      return { ...state, modo: action.payload, paso: 0 };
    case 'NEXT_STEP':
      return { ...state, paso: state.paso + 1 };
    case 'PREV_STEP':
      return { ...state, paso: state.paso - 1 };
    case 'UPDATE_ALUMNO':
      return { ...state, alumno: { ...state.alumno, ...action.payload } };
    case 'UPDATE_INSCRIPCION':
      return { ...state, inscripcion: { ...state.inscripcion, ...action.payload } };
    case 'UPDATE_PAGO':
      return { ...state, pago: { ...state.pago, ...action.payload } };
    case 'SET_CATALOGOS':
      return { ...state, catalogos: { ...state.catalogos, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'RESET':
      return initialState;
    case 'OPEN_MODAL':
      return { ...state, modales: { ...state.modales, [action.payload]: true } };
    case 'CLOSE_MODAL':
      return { ...state, modales: { ...state.modales, [action.payload]: false } };
    case 'SET_PASO':
      return { ...state, paso: action.payload };
    case 'SET_SIGUIENTE_CARNET':
      return { ...state, siguienteCarnet: action.payload };
    case 'SET_MOSTRAR_NUEVA':
      return { ...state, mostrarNuevaInscripcion: action.payload };  
    case 'SET_GRADOS':
      return { ...state, grados: action.payload };  
    case 'SHOW_INITIAL_POPUP':
      return { ...state, showInitialPopup: true };
    case 'HIDE_INITIAL_POPUP':
      return { ...state, showInitialPopup: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export const useInscripcionForm = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Verificar y actualizar IdColaborador si cambió o no existe
  useEffect(() => {
    const IdColaborador = getIdColaborador();
    if (IdColaborador && IdColaborador !== state.user.IdColaborador) {
      dispatch({ type: 'UPDATE_USER', payload: { IdColaborador } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCatalogos = async () => {
      if (!isMounted) return; // ← Evita ejecución si ya se desmontó

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const [gradosRes, seccionesRes, jornadasRes, familiasRes] = await Promise.all([
          apiClient.get('/grados').catch(() => ({ data: { data: [] } })),
          apiClient.get('/secciones').catch(() => ({ data: { data: [] } })),
          apiClient.get('/jornadas').catch(() => ({ data: { data: [] } })),
          apiClient.get('/familias').catch(() => ({ data: { data: [] } })),
        ]);

        // ORDENAR GRADOS
        const gradosCrudos = gradosRes.data.data || [];
        const gradosOrdenados = [...gradosCrudos].sort((a, b) => {
          const nivelA = parseInt(a.IdNivel, 10);
          const nivelB = parseInt(b.IdNivel, 10);
          if (nivelA !== nivelB) return nivelA - nivelB;
          return a.IdGrado - b.IdGrado;
        });

        console.log('GRADOS ORDENADOS (final):', gradosOrdenados);

        dispatch({
          type: 'SET_CATALOGOS',
          payload: {
            grados: gradosOrdenados,
            secciones: seccionesRes.data.data || seccionesRes.data || [],
            jornadas: jornadasRes.data.data || jornadasRes.data || [],
            familias: familiasRes.data.data || familiasRes.data || [],
          },
        });
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    fetchCatalogos();

    return () => {
      isMounted = false; // ← Limpieza
    };
  }, []); // ← Mantiene [] para que sea solo al montar

// RECARGAR FAMILIAS DESPUÉS DE CREAR
useEffect(() => {
  if (state.alumno.IdFamilia && !state.catalogos.familias.find(f => f.IdFamilia === state.alumno.IdFamilia)) {
    const fetchFamilia = async () => {
      try {
        const res = await apiClient.get('/familias');
        const nuevas = Array.isArray(res.data.data) ? res.data.data : res.data;
        dispatch({
          type: 'SET_CATALOGOS',
          payload: { familias: nuevas },
        });
      } catch (error) {}
    };
    fetchFamilia();
  }
}, [state.alumno.IdFamilia]);

  return { state, dispatch };
};
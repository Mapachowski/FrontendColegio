import apiClient from '../api/apiClient';

/**
 * Registra una acción en la bitácora del sistema
 * @param {string} accion - Descripción de la acción realizada
 * @param {string} observacion - Detalles adicionales de la acción (opcional)
 * @returns {Promise<void>}
 */
export const registrarBitacora = async (accion, observacion = '') => {
  try {
    // Obtener usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const idUsuario = user.IdUsuario;

    if (!idUsuario) {
      return;
    }

    // Preparar payload
    const payload = {
      Accion: accion,
      FechaBitacora: new Date().toISOString(),
      Ordenador: window.navigator.userAgent, // User agent del navegador
      IdUsuario: idUsuario,
      Observacion: observacion || ''
    };

    // Enviar a la API
    await apiClient.post('/bitacoras', payload);

    // Log solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    // No bloquear la operación principal si falla el registro de bitácora
  }
};

/**
 * Registra una descarga de Excel en la bitácora
 * @param {string} nombreReporte - Nombre del reporte descargado (ej: "Listado de Alumnos")
 * @returns {Promise<void>}
 */
export const registrarDescargaExcel = async (nombreReporte) => {
  await registrarBitacora(
    'Descarga de reporte Excel',
    `Reporte: ${nombreReporte}`
  );
};

/**
 * Registra una acción de creación en la bitácora
 * @param {string} entidad - Tipo de entidad creada (ej: "Alumno", "Pago", "Inscripción")
 * @param {string|number} identificador - ID o identificador del registro creado (opcional)
 * @returns {Promise<void>}
 */
export const registrarCreacion = async (entidad, identificador = '') => {
  const observacion = identificador ? `${entidad} ID: ${identificador}` : entidad;
  await registrarBitacora(
    `Creación de ${entidad}`,
    observacion
  );
};

/**
 * Registra una acción de edición en la bitácora
 * @param {string} entidad - Tipo de entidad editada (ej: "Alumno", "Pago")
 * @param {string|number} identificador - ID o identificador del registro editado (opcional)
 * @returns {Promise<void>}
 */
export const registrarEdicion = async (entidad, identificador = '') => {
  const observacion = identificador ? `${entidad} ID: ${identificador}` : entidad;
  await registrarBitacora(
    `Edición de ${entidad}`,
    observacion
  );
};

/**
 * Registra una acción de eliminación en la bitácora
 * @param {string} entidad - Tipo de entidad eliminada (ej: "Alumno", "Pago")
 * @param {string|number} identificador - ID o identificador del registro eliminado (opcional)
 * @returns {Promise<void>}
 */
export const registrarEliminacion = async (entidad, identificador = '') => {
  const observacion = identificador ? `${entidad} ID: ${identificador}` : entidad;
  await registrarBitacora(
    `Eliminación de ${entidad}`,
    observacion
  );
};

/**
 * Registra un reset de contraseña en la bitácora
 * @param {string} usuarioAfectado - Usuario cuya contraseña fue reseteada
 * @returns {Promise<void>}
 */
export const registrarResetPassword = async (usuarioAfectado) => {
  await registrarBitacora(
    'Reset de contraseña',
    `Usuario afectado: ${usuarioAfectado}`
  );
};

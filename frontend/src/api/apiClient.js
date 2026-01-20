import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 30000, // 30 segundos timeout para requests
});

// Solo mostrar en desarrollo
if (process.env.NODE_ENV === 'development') {
}

// ============================================
// INTERCEPTOR DE REQUEST (Agregar Token)
// ============================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Manejo de errores en la configuración del request
    return Promise.reject(error);
  }
);

// ============================================
// INTERCEPTOR DE RESPONSE (Manejo de Errores)
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente la retornamos
    return response;
  },
  (error) => {
    // Extraer información del error
    const status = error.response?.status;

    // 401 Unauthorized - Token inválido o expirado
    if (status === 401) {

      // Limpiar toda la información de autenticación
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Prevenir redirección infinita si ya estamos en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }

      return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
    }

    // 400 Bad Request - Solicitud incorrecta (datos inválidos, validaciones fallidas, etc.)
    if (status === 400) {
      // Mantener el error completo para que el componente pueda acceder a error.response.data
      return Promise.reject(error);
    }

    // 403 Forbidden - Usuario no tiene permisos
    if (status === 403) {
      const mensajeError = error.response?.data?.error || error.response?.data?.message || 'No tienes permisos para realizar esta acción.';
      return Promise.reject(new Error(mensajeError));
    }

    // 404 Not Found
    if (status === 404) {
      return Promise.reject(new Error('El recurso solicitado no existe.'));
    }

    // 500 Internal Server Error
    if (status === 500) {
      return Promise.reject(new Error('Error interno del servidor. Intenta nuevamente más tarde.'));
    }

    // 503 Service Unavailable
    if (status === 503) {
      return Promise.reject(new Error('El servicio no está disponible temporalmente.'));
    }

    // Timeout Error
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('La solicitud tardó demasiado tiempo. Verifica tu conexión.'));
    }

    // Network Error (sin conexión)
    if (!error.response) {
      return Promise.reject(new Error('Error de conexión. Verifica tu red e intenta nuevamente.'));
    }

    // Cualquier otro error
    return Promise.reject(error);
  }
);

export default apiClient;
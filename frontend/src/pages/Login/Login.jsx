import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import './Login.css';
import Carousel from '../../components/Carousel';

const Login = ({ onLoginSuccess }) => {
  const [NombreUsuario, setNombreUsuario] = useState('');
  const [Contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const trimmedNombreUsuario = NombreUsuario.trim();
    if (!trimmedNombreUsuario || !Contrasena) {
      setError('Por favor, completa todos los campos.');
      setIsLoading(false);
      return;
    }
    try {
      const response = await apiClient.post('/login', {
        NombreUsuario: trimmedNombreUsuario,
        Contrasena,
      });
      if (response.data.token) {
        const { token, usuario } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          IdUsuario: usuario.id, // Usamos usuario.id como IdUsuario
          rol: usuario.rol,     // Usamos usuario.rol como rol
        }));
        onLoginSuccess({ IdUsuario: usuario.id, rol: usuario.rol }); // Pasa los datos al padre
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || 'Usuario o contraseña incorrectos.');
      } else if (err.request) {
        setError('No se pudo conectar al servidor. Verifica tu conexión.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-form">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Email o Usuario</label>
              <input
                id="username"
                type="text"
                value={NombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Ingresa tu email o usuario"
                required
                aria-describedby="username-error"
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={Contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                aria-describedby="password-error"
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Ingresar'}
            </button>
            {error && (
              <p id="error-message" className="error-text">
                {error}
              </p>
            )}
          </form>
        </div>
        <div className="carousel-section">
          <Carousel />
        </div>
      </div>
    </div>
  );
};

export default Login;
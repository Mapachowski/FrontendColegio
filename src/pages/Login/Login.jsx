import React, { useState } from 'react';
import apiClient from '../../api/apiClient';
import './Login.css';
import Carousel from '../../components/Carousel';
import { message } from 'antd';
import { sanitizeHTML } from '../../utils/sanitize';

const Login = ({ onLoginSuccess }) => {
  const [NombreUsuario, setNombreUsuario] = useState('');
  const [Contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL; // ← Usamos variable de entorno

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
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          NombreUsuario: trimmedNombreUsuario,
          Contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en el servidor');
      }

      // En handleSubmit
      if (data.token && data.usuario) {
        const { token, usuario } = data;

        const userData = {
          IdUsuario: usuario.IdUsuario,
          NombreUsuario: usuario.NombreUsuario,
          NombreCompleto: usuario.NombreCompleto || 'Sin nombre', // GUARDADO
          rol: usuario.IdRol
        };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Registrar en bitácora
        try {
          await fetch(`${API_URL}/bitacoras`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              Accion: `Inicio de sesión - ${trimmedNombreUsuario}`,
              FechaBitacora: new Date().toISOString(),
              Ordenador: window.navigator.userAgent,
              IdUsuario: usuario.IdUsuario
            })
          });
        } catch (errBitacora) {
          console.error('Error al registrar bitácora:', errBitacora);
          // No bloquear el login si falla el registro de bitácora
        }

        // Sanitizar nombre de usuario para prevenir XSS en mensajes
        const nombreSeguro = sanitizeHTML(usuario.NombreUsuario);
        message.success(`¡Bienvenido, ${nombreSeguro}!`);
        onLoginSuccess(userData);
      }
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos.');
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
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Ingresar'}
            </button>
            {error && <p className="error-text">{error}</p>}
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
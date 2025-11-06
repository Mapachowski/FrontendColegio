import React from 'react';

const Home = ({ usuario, onLogout }) => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Bienvenido, {usuario?.nombre || 'Usuario'}</h2>
      <p>Tu sesión está activa.</p>
      <button onClick={onLogout}>Cerrar sesión</button>
    </div>
  );
};

export default Home;

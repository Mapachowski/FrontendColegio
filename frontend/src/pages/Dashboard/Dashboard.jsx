import React from 'react';
import { Layout } from 'antd';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Home from '../../components/Home';
import Preferencias from './Preferencias';
import Inscripciones from './Inscripciones/Inscripciones';
import CrearPago from './Pagos/CrearPagos';
import './Dashboard.css';

const { Content } = Layout;

const Dashboard = ({ user }) => {
  if (!user) return null;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar user={user} />
      <Layout style={{ marginLeft: 250 }}> {/* Ajusta el margen izquierdo al ancho del Sidebar */}
        <Header user={user} />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 'calc(100vh - 64px)' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/preferencias" element={<Preferencias />} />
            <Route path="/inscripciones/inscripciones" element={<Inscripciones />} />
            <Route path="/pagos/crear" element={<CrearPago />} />
            {/* Agrega más rutas */}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
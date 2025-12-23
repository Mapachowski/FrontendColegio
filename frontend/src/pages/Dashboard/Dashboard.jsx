import React from 'react';
import { Layout } from 'antd';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import Home from '../../components/Home';
import Preferencias from './Establecimiento/Preferencias';
import Docentes from './Establecimiento/Docentes';
import Cursos from './Establecimiento/Cursos';
import CredencialesAccesoDocentes from './Establecimiento/CredencialesAccesoDocentes';
import Inscripciones from './Inscripciones/Inscripciones';
import CrearPago from './Pagos/CrearPagos';
import BuscarRecibo from './Pagos/BuscarRecibo';
import ReportePagosFechas from './Pagos/ReportePagosFechas';
import PagosHoy from './Pagos/PagosHoy';
import Insolventes from './Pagos/Insolventes';
import EditarAlumno from './Alumnos/EditarAlumno';
import ListadoAlumnos from './Alumnos/FiltrosInscripciones';
import EstudiantesRetirados from './Alumnos/EstudiantesRetirados';
import ListadoResponsables from './Alumnos/ListadoResponsables';
import CredencialesAcceso from './Estudiantes/CredencialesAcceso';
import AsignacionCursos from './ConfigurarAcademico/AsignacionCursos/AsignacionCursos';
import AsignacionMasiva from './ConfigurarAcademico/AsignacionCursos/AsignacionMasiva';
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
            <Route path="/" element={<Home
              usuario={user}
              onLogout={() => {
                window.location.href = '/login'; // ← Redirige al login
              }}
/>} />
            <Route path="/preferencias" element={<Preferencias />} />
            <Route path="/establecimiento/docentes" element={<Docentes />} />
            <Route path="/establecimiento/cursos" element={<Cursos />} />
            <Route path="/establecimiento/credenciales-docente" element={<CredencialesAccesoDocentes />} />
            <Route path="/inscripciones/inscripciones" element={<Inscripciones />} />
            <Route path="/pagos/crear" element={<CrearPago />} />
            <Route path="/pagos/buscar-recibo" element={<BuscarRecibo />} />
            <Route path="/pagos/reporte-fechas" element={<ReportePagosFechas />} />
            <Route path="/pagos/pagos-hoy" element={<PagosHoy />} />
            <Route path="/pagos/insolventes" element={<Insolventes />} />
            <Route path="/alumnos/editar" element={<EditarAlumno />} />
            <Route path="/alumnos/listado" element={<ListadoAlumnos />} />
            <Route path="/alumnos/estudiantes-retirados" element={<EstudiantesRetirados />} />
            <Route path="/alumnos/listado-responsables" element={<ListadoResponsables />} />
            <Route path="/estudiantes/credenciales-acceso" element={<CredencialesAcceso />} />
            <Route path="/configurar-academico/asignacion-cursos" element={<AsignacionCursos />} />
            <Route path="/configurar-academico/asignacion-masiva" element={<AsignacionMasiva />} />
            {/* Agrega más rutas */}
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
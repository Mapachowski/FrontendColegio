import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, message, Typography, Empty } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';
import CursoCard from './components/CursoCard';
import ActividadesModal from './components/ActividadesModal';
import FiltrosAdmin from './components/FiltrosAdmin';
import { getCicloActual } from '../../../../utils/cicloEscolar';

const { Title } = Typography;

const AulaCandelaria = () => {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  // Filtros para admin
  const [filtros, setFiltros] = useState({
    anio: getCicloActual(),
    idGrado: null,
    idSeccion: null,
    idJornada: null
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  useEffect(() => {
    if (perfil) {
      cargarCursos();
    }
  }, [perfil, filtros]);

  const cargarPerfil = async () => {
    try {

      // Verificar localStorage
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');

      try {
        const response = await apiClient.get('/login/perfil');

        if (response.data.success) {
          setPerfil(response.data.data);
        } else {
          // Fallback: usar datos de localStorage
          setPerfil(userFromStorage);
        }
      } catch (apiError) {

        // Fallback: usar localStorage
        if (userFromStorage.IdUsuario) {
          // Si no tiene IdAlumno ni IdDocente, intentar obtenerlos
          if (!userFromStorage.IdAlumno && !userFromStorage.IdDocente) {

            try {
              // Intentar buscar alumno por IdUsuario
              if (userFromStorage.IdRol === 5) {
                const alumnoRes = await apiClient.get(`/alumnos?idUsuario=${userFromStorage.IdUsuario}`);

                if (alumnoRes.data && alumnoRes.data.length > 0) {
                  const alumno = alumnoRes.data[0];
                  userFromStorage.IdAlumno = alumno.IdAlumno;
                  userFromStorage.Matricula = alumno.Matricula;
                }
              }
              // Intentar buscar docente por IdUsuario
              else if (userFromStorage.IdRol === 4) {
                const docenteRes = await apiClient.get(`/docentes?idUsuario=${userFromStorage.IdUsuario}`);

                if (docenteRes.data && docenteRes.data.length > 0) {
                  const docente = docenteRes.data[0];
                  userFromStorage.IdDocente = docente.idDocente;
                  userFromStorage.NombreDocente = docente.NombreDocente;
                }
              }
            } catch (searchError) {
            }
          }

          setPerfil(userFromStorage);
          message.warning('Usando datos almacenados localmente');
        } else {
          throw new Error('No hay datos de usuario en localStorage');
        }
      }
    } catch (error) {
      message.error('Error al cargar información del usuario. Por favor, vuelve a iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const cargarCursos = async () => {
    setLoading(true);
    try {
      const rol = perfil.IdRol;

      let response;
      let url = '';

      // ESTUDIANTE (IdRol = 5)
      if (rol === 5) {
        const idAlumno = perfil.IdAlumno;
        const anioActual = getCicloActual();
        url = `/alumnos/${idAlumno}/cursos-actuales/${anioActual}`;
        response = await apiClient.get(url);
      }
      // DOCENTE (IdRol = 4)
      else if (rol === 4) {
        const idDocente = perfil.IdDocente;
        url = `/docentes/${idDocente}/asignaciones-actuales`;
        response = await apiClient.get(url);
      }
      // ADMIN (IdRol = 1) u otros roles
      else if (rol === 1) {
        const params = {
          anio: filtros.anio,
          ...(filtros.idGrado && { idGrado: filtros.idGrado }),
          ...(filtros.idSeccion && { idSeccion: filtros.idSeccion }),
          ...(filtros.idJornada && { idJornada: filtros.idJornada })
        };
        url = '/asignaciones';
        response = await apiClient.get(url, { params });
      }


      // Manejar respuesta
      let cursosData = [];
      if (response.data.success && response.data.data) {
        const data = response.data.data;

        if (Array.isArray(data)) {
          // Manejar objeto con claves numéricas
          if (data.length > 0 && typeof data[0] === 'object' && !data[0].IdAsignacionDocente && !data[0].idAsignacion) {
            cursosData = Object.keys(data[0])
              .filter(key => !isNaN(key))
              .map(key => data[0][key])
              .filter(item => item && (item.IdAsignacionDocente || item.idAsignacion));
          } else {
            cursosData = data;
          }
        } else if (typeof data === 'object' && (data.IdAsignacionDocente || data.idAsignacion)) {
          cursosData = [data];
        }
      } else if (Array.isArray(response.data)) {
        cursosData = response.data;
      }

      setCursos(cursosData);
    } catch (error) {
      message.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (curso) => {
    setCursoSeleccionado(curso);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setCursoSeleccionado(null);
    // Recargar cursos para actualizar el contador de actividades
    if (perfil) {
      cargarCursos();
    }
  };

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
  };

  if (!perfil) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <p style={{ marginTop: 20 }}>Cargando...</p>
      </div>
    );
  }

  const esEstudiante = perfil.IdRol === 5;
  const esDocente = perfil.IdRol === 4;
  const esAdmin = perfil.IdRol === 1;

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Title level={2} style={{ margin: 0, color: '#003366' }}>
          <BookOutlined /> Aula Candelaria
        </Title>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          {esEstudiante && `Bienvenido, ${perfil.NombreCompleto} - Tus cursos del ciclo ${getCicloActual()}`}
          {esDocente && `Bienvenido, ${perfil.NombreCompleto} - Tus asignaciones del ciclo ${getCicloActual()}`}
          {esAdmin && 'Panel de Administración - Monitoreo de Actividades por Grado'}
        </p>
      </div>

      {/* Filtros para Admin */}
      {esAdmin && (
        <FiltrosAdmin
          filtros={filtros}
          onFiltrosChange={handleFiltrosChange}
        />
      )}

      {/* Cursos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <Spin size="large" />
          <p style={{ marginTop: 20 }}>Cargando cursos...</p>
        </div>
      ) : cursos.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '60px 20px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Empty
            description={
              esAdmin
                ? "No hay asignaciones con los filtros seleccionados"
                : "No tienes cursos asignados en este momento"
            }
          />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {cursos.map((curso) => (
            <Col xs={24} sm={12} md={8} lg={6} key={curso.IdAsignacionDocente || curso.idAsignacion}>
              <CursoCard
                curso={curso}
                esEstudiante={esEstudiante}
                esDocente={esDocente}
                esAdmin={esAdmin}
                onClick={() => handleCardClick(curso)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Modal de Actividades */}
      <ActividadesModal
        visible={modalVisible}
        curso={cursoSeleccionado}
        esEstudiante={esEstudiante}
        esDocente={esDocente}
        esAdmin={esAdmin}
        idAlumno={perfil?.IdAlumno || null}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AulaCandelaria;

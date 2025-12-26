// src/pages/dashboard/alumnos/EditarAlumno.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Input, Select, Switch, Button, Space, Tag, Typography, Row, Col, message, Spin, Modal
} from 'antd';
import BuscarAlumnoEditarModal from './components/BuscarAlumnoEditarModal';
import EditarFamiliaModal from './components/EditarFamiliaModal';
import apiClient from '../../../api/apiClient';

const { Title } = Typography;
const { TextArea } = Input;

const EditarAlumno = () => {
  const navigate = useNavigate();
  const [openBuscar, setOpenBuscar] = useState(true);
  const [openFamilia, setOpenFamilia] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);

  // Datos del alumno e inscripción
  const [alumnoData, setAlumnoData] = useState(null);
  const [familiaData, setFamiliaData] = useState(null);
  const [inscripcionData, setInscripcionData] = useState(null);

  // Estados editables
  const [numeroEmergencia, setNumeroEmergencia] = useState('');
  const [nombreEmergencia, setNombreEmergencia] = useState('');
  const [visible, setVisible] = useState(true);
  const [idSeccion, setIdSeccion] = useState(null);
  const [idJornada, setIdJornada] = useState(null);
  const [inscripcionActiva, setInscripcionActiva] = useState(true);
  const [observacion, setObservacion] = useState('');

  // Catálogos
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Cargar catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [seccionesRes, jornadasRes] = await Promise.all([
          apiClient.get('/secciones'),
          apiClient.get('/jornadas'),
        ]);
        setSecciones(Array.isArray(seccionesRes.data) ? seccionesRes.data : seccionesRes.data.data || []);
        setJornadas(Array.isArray(jornadasRes.data) ? jornadasRes.data : jornadasRes.data.data || []);
      } catch (error) {
        console.error('ERROR CARGANDO CATÁLOGOS:', error);
      }
    };
    cargarCatalogos();
  }, []);

  const handleAlumnoSeleccionado = async (record) => {
    setLoading(true);
    try {
      console.log('RECORD RECIBIDO COMPLETO:', record);

      // Guardar datos del alumno
      setAlumnoData(record);
      setInscripcionData(record);

      // Mapear campos de emergencia (vienen del SP)
      setNumeroEmergencia(record.NumeroEmergencia || '');
      setNombreEmergencia(record.ContactoEmergencia || '');
      setVisible(record.Visible !== false);

      // Establecer valores de sección y jornada
      // Si vienen los IDs directamente del SP, usarlos. Si no, intentar mapear por nombre
      setIdSeccion(record.IdSeccion || null);
      setIdJornada(record.IdJornada || null);

      // Estado activo por defecto (1 = Activo, 0 = Inactivo)
      const esActivo = record.Estado === undefined || record.Estado === null || record.Estado === 1 || record.Estado === 'Activo' || record.Estado === true;
      setInscripcionActiva(esActivo);
      setObservacion(record.ComentarioEstado || '');

      // Mapear datos de familia directamente del SP (no necesita llamada adicional)
      if (record.IdFamilia) {
        const familiaFromRecord = {
          IdFamilia: record.IdFamilia,
          NombreFamilia: record.NombreFamilia,
          NombreRecibo: record.NombreFamilia, // Usar NombreFamilia si no viene NombreRecibo
          TelefonoRecibo: record.TelefonoContacto,
          CorreoElectronico: record.EmailContacto,
          DireccionRecibo: record.Direccion,
        };
        setFamiliaData(familiaFromRecord);
        console.log('FAMILIA MAPEADA:', familiaFromRecord);
      }

      console.log('DATOS FINALES CARGADOS:', {
        alumno: {
          IdAlumno: record.IdAlumno,
          ContactoEmergencia: record.ContactoEmergencia,
          NumeroEmergencia: record.NumeroEmergencia,
        },
        inscripcion: {
          IdInscripcion: record.IdInscripcion,
          IdSeccion: record.IdSeccion,
          IdJornada: record.IdJornada,
          Estado: record.Estado,
        },
      });

      setOpenBuscar(false);
    } catch (error) {
      console.error('ERROR AL CARGAR DATOS:', error);
      message.error('Error al cargar los datos del alumno');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCambios = async () => {
    // Validar que si está inactiva, tenga observación
    if (!inscripcionActiva && !observacion.trim()) {
      message.error('Debes ingresar el motivo de la inscripción inactiva');
      return;
    }

    // Obtener IdColaborador del localStorage
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const IdColaborador = userFromStorage.IdUsuario;

    if (!IdColaborador) {
      message.error('No se encontró el usuario en sesión. Por favor, recarga la página.');
      return;
    }

    console.log('IdColaborador obtenido para guardar cambios:', IdColaborador);
    console.log('Datos de inscripción a actualizar:', {
      IdInscripcion: inscripcionData.IdInscripcion,
      IdSeccion: idSeccion,
      IdJornada: idJornada,
      Estado: inscripcionActiva ? 1 : 0,
      ComentarioEstado: inscripcionActiva ? '' : observacion,
    });

    setLoading(true);
    try {
      // 1. Actualizar datos del alumno
      const alumnoResponse = await apiClient.put(`/alumnos/${alumnoData.IdAlumno}`, {
        NumeroEmergencia: numeroEmergencia,
        ContactoEmergencia: nombreEmergencia,
        Visible: visible,
        Estado: visible ? 1 : 0, // Si no es visible, Estado = 0 (inactivo)
        IdColaborador,
      });
      console.log('Respuesta actualización alumno:', alumnoResponse.data);

      // 2. Actualizar inscripción
      if (inscripcionData.IdInscripcion) {
        const inscripcionResponse = await apiClient.put(`/inscripciones/${inscripcionData.IdInscripcion}`, {
          IdSeccion: idSeccion,
          IdJornada: idJornada,
          Estado: inscripcionActiva ? 1 : 0,
          ComentarioEstado: inscripcionActiva ? '' : observacion,
          IdColaborador,
        });
        console.log('Respuesta actualización inscripción:', inscripcionResponse.data);
      }

      // Mostrar modal de éxito y redirigir
      Modal.success({
        title: 'Estudiante actualizado con éxito',
        content: 'Los cambios se han guardado correctamente.',
        onOk: () => {
          navigate('/dashboard');
        },
      });
    } catch (error) {
      console.error('ERROR AL GUARDAR:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      message.error('Error al guardar los cambios. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegresarDashboard = () => {
    navigate('/dashboard');
  };

  if (openBuscar) {
    return (
      <BuscarAlumnoEditarModal
        open={true}
        onCancel={() => window.history.back()}
        onAlumnoSeleccionado={handleAlumnoSeleccionado}
      />
    );
  }

  if (loading || !alumnoData) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        Editar Alumno – {alumnoData.Nombres} {alumnoData.Apellidos}
      </Title>
      <Title level={5} type="secondary">
        Matrícula: <Tag color="blue">{alumnoData.Matricula}</Tag> | Ciclo {inscripcionData?.CicloEscolar}
      </Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 24 }}>
        {/* PESTAÑA 1 - DATOS PERSONALES Y FAMILIA */}
        <Tabs.TabPane tab="1. Datos Personales y Familia" key="1">
          <Card title="Contacto de Emergencia" style={{ marginBottom: 16 }}>
            <Input
              addonBefore="Nombre"
              placeholder="Nombre del contacto de emergencia"
              value={nombreEmergencia}
              onChange={(e) => setNombreEmergencia(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Input
              addonBefore="Teléfono"
              placeholder="5555-1234"
              value={numeroEmergencia}
              onChange={(e) => setNumeroEmergencia(e.target.value)}
            />
            <div style={{ marginTop: 16 }}>
              <Switch checked={visible} onChange={setVisible} />
              <span style={{ marginLeft: 8 }}>Alumno visible en el sistema</span>
            </div>
          </Card>

          <Card
            title="Familia"
            extra={
              <Button type="primary" onClick={() => setOpenFamilia(true)}>
                Modificar Familia
              </Button>
            }
          >
            {familiaData ? (
              <>
                <p><strong>Recibo a nombre:</strong> {familiaData.NombreRecibo || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> {familiaData.TelefonoRecibo || 'No especificado'}</p>
                <p><strong>Email:</strong> {familiaData.CorreoElectronico || 'No especificado'}</p>
                <p><strong>Dirección:</strong> {familiaData.DireccionRecibo || 'No especificada'}</p>
              </>
            ) : (
              <p>No hay información de familia disponible</p>
            )}
          </Card>

          {/* BOTÓN SIGUIENTE */}
          <div style={{ marginTop: 40, textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={() => setActiveTab('2')}>
              Siguiente →
            </Button>
          </div>
        </Tabs.TabPane>

        {/* PESTAÑA 2 - INSCRIPCIÓN */}
        <Tabs.TabPane tab={`2. Inscripción ${inscripcionData?.CicloEscolar}`} key="2">
          <Card>
            <p><strong>Grado:</strong> {inscripcionData?.NombreGrado}</p>

            {/* Información actual */}
            <div style={{ marginTop: 16, marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <strong>Sección actual:</strong> <span style={{ color: '#1890ff', fontSize: 16 }}>{inscripcionData?.NombreSeccion || 'No asignada'}</span>
                </Col>
                <Col span={12}>
                  <strong>Jornada actual:</strong> <span style={{ color: '#1890ff', fontSize: 16 }}>{inscripcionData?.NombreJornada || 'No asignada'}</span>
                </Col>
              </Row>
            </div>

            <p style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>Selecciona nuevos valores si deseas cambiarlos:</p>
            <Space style={{ marginTop: 8 }}>
              <Select
                style={{ width: 300 }}
                placeholder="Seleccionar sección"
                value={idSeccion}
                onChange={setIdSeccion}
              >
                {secciones.map((s) => (
                  <Select.Option key={s.IdSeccion} value={s.IdSeccion}>
                    {s.NombreSeccion}
                  </Select.Option>
                ))}
              </Select>

              <Select
                style={{ width: 300 }}
                placeholder="Seleccionar jornada"
                value={idJornada}
                onChange={setIdJornada}
              >
                {jornadas.map((j) => (
                  <Select.Option key={j.IdJornada} value={j.IdJornada}>
                    {j.NombreJornada}
                  </Select.Option>
                ))}
              </Select>
            </Space>

            <div style={{ marginTop: 24 }}>
              <Space>
                <Switch
                  checked={inscripcionActiva}
                  onChange={setInscripcionActiva}
                  checkedChildren="Activa"
                  unCheckedChildren="Inactiva"
                />
                <span style={{ fontWeight: 500 }}>Inscripción Activa</span>
              </Space>
            </div>

            {/* OBSERVACIÓN - Aparece solo si está inactiva */}
            {!inscripcionActiva && (
              <div style={{ marginTop: 20 }}>
                <TextArea
                  rows={5}
                  placeholder="Escribe el motivo del retiro, traslado, suspensión, etc. (obligatorio)"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  style={{
                    borderColor: '#d9363e',
                    boxShadow: '0 0 8px rgba(217, 54, 62, 0.15)'
                  }}
                />
              </div>
            )}
          </Card>

          {/* BOTONES ATRÁS Y GUARDAR */}
          <Row justify="space-between" style={{ marginTop: 40 }}>
            <Col>
              <Button size="large" onClick={() => setActiveTab('1')}>
                ← Atrás
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                style={{ minWidth: 240 }}
                onClick={handleGuardarCambios}
                loading={loading}
              >
                Guardar todos los cambios
              </Button>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>

      {/* BOTÓN REGRESAR AL DASHBOARD */}
      <div style={{ marginTop: 40, textAlign: 'center', paddingBottom: 24 }}>
        <Button
          size="large"
          onClick={handleRegresarDashboard}
          style={{ minWidth: 200 }}
        >
          Regresar al Dashboard
        </Button>
      </div>

      {familiaData && (
        <EditarFamiliaModal
          open={openFamilia}
          onCancel={() => setOpenFamilia(false)}
          familiaData={familiaData}
          onFamiliaActualizada={(nuevaFamilia) => {
            setFamiliaData(nuevaFamilia);
            message.success('Datos de familia actualizados');
          }}
        />
      )}
    </div>
  );
};

export default EditarAlumno;
// src/pages/dashboard/alumnos/EditarAlumno.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Input, Select, Switch, Button, Space, Tag, Typography, Row, Col, message, Spin, DatePicker, Alert, Divider
} from 'antd';
import { SwapOutlined, StopOutlined, WarningOutlined } from '@ant-design/icons';
import BuscarAlumnoEditarModal from './components/BuscarAlumnoEditarModal';
import EditarFamiliaModal from './components/EditarFamiliaModal';
import apiClient from '../../../api/apiClient';
import moment from 'moment';
import { registrarBitacora } from '../../../utils/bitacora';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EditarAlumno = () => {
  const navigate = useNavigate();
  const [openBuscar, setOpenBuscar] = useState(true);
  const [openFamilia, setOpenFamilia] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [activeSubTab, setActiveSubTab] = useState('antes'); // Sub-pestaña de inscripción
  const [loading, setLoading] = useState(false);

  // Datos del alumno e inscripción
  const [alumnoData, setAlumnoData] = useState(null);
  const [familiaData, setFamiliaData] = useState(null);
  const [inscripcionData, setInscripcionData] = useState(null);
  const [cicloEscolar, setCicloEscolar] = useState(null);

  // Estados editables del alumno
  const [matricula, setMatricula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(null);
  const [genero, setGenero] = useState('');
  const [comunidadLinguistica, setComunidadLinguistica] = useState('');
  const [numeroEmergencia, setNumeroEmergencia] = useState('');
  const [nombreEmergencia, setNombreEmergencia] = useState('');
  const [visible, setVisible] = useState(true);

  // Estados editables de inscripción - Cambio ANTES de inicio
  const [idGrado, setIdGrado] = useState(null);
  const [idSeccion, setIdSeccion] = useState(null);
  const [idJornada, setIdJornada] = useState(null);

  // Estados para Cambio DESPUÉS de inicio (usa endpoint cambiar-grupo)
  const [idSeccionNueva, setIdSeccionNueva] = useState(null);
  const [idJornadaNueva, setIdJornadaNueva] = useState(null);
  const [unidadActual, setUnidadActual] = useState(null);
  const [motivoCambio, setMotivoCambio] = useState('');
  const [loadingCambioGrupo, setLoadingCambioGrupo] = useState(false);

  // Estados para Suspensión
  const [inscripcionActiva, setInscripcionActiva] = useState(true);
  const [observacion, setObservacion] = useState('');

  // Catálogos
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Lista de unidades
  const unidades = [
    { value: 1, label: 'Primera Unidad' },
    { value: 2, label: 'Segunda Unidad' },
    { value: 3, label: 'Tercera Unidad' },
    { value: 4, label: 'Cuarta Unidad' },
  ];

  // Cargar catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [gradosRes, seccionesRes, jornadasRes] = await Promise.all([
          apiClient.get('/grados'),
          apiClient.get('/secciones'),
          apiClient.get('/jornadas'),
        ]);
        setGrados(Array.isArray(gradosRes.data) ? gradosRes.data : gradosRes.data.data || []);
        setSecciones(Array.isArray(seccionesRes.data) ? seccionesRes.data : seccionesRes.data.data || []);
        setJornadas(Array.isArray(jornadasRes.data) ? jornadasRes.data : jornadasRes.data.data || []);
      } catch (error) {
      }
    };
    cargarCatalogos();
  }, []);

  const handleAlumnoSeleccionado = async (record) => {
    setLoading(true);
    try {

      // Guardar datos del alumno
      setAlumnoData(record);
      setInscripcionData(record);

      // Guardar el ciclo escolar
      if (record.CicloEscolar) {
        setCicloEscolar(record.CicloEscolar);
      }

      // Mapear campos editables del alumno
      setMatricula(record.Matricula || '');
      setNombres(record.Nombres || '');
      setApellidos(record.Apellidos || '');
      setFechaNacimiento(record.FechaNacimiento ? moment(record.FechaNacimiento) : null);
      setGenero(record.Genero || '');
      setComunidadLinguistica(record.ComunidadLinguistica || '');
      setNumeroEmergencia(record.NumeroEmergencia || '');
      setNombreEmergencia(record.ContactoEmergencia || '');
      setVisible(record.Visible !== false);

      // Establecer valores de grado, sección y jornada
      setIdGrado(record.IdGrado || null);
      setIdSeccion(record.IdSeccion || null);
      setIdJornada(record.IdJornada || null);

      // Inicializar valores para cambio después de inicio (sin selección)
      setIdSeccionNueva(null);
      setIdJornadaNueva(null);
      setUnidadActual(null);
      setMotivoCambio('');

      // Estado activo
      const esActivo = record.Estado === undefined || record.Estado === null || record.Estado === 1 || record.Estado === 'Activo' || record.Estado === true;
      setInscripcionActiva(esActivo);
      setObservacion(record.ComentarioEstado || '');

      // Cargar datos completos de familia
      if (record.IdFamilia) {
        try {
          const familiaResponse = await apiClient.get(`/familias/${record.IdFamilia}`);
          const familiaCompleta = familiaResponse.data.data || familiaResponse.data;

          const familiaFromAPI = {
            IdFamilia: record.IdFamilia,
            NombreFamilia: record.NombreFamilia,
            IdUsuario: familiaCompleta.IdUsuario || null,
            NombreRecibo: familiaCompleta.NombreRecibo || '',
            TelefonoRecibo: familiaCompleta.TelefonoContacto || record.TelefonoContacto || '',
            CorreoElectronico: familiaCompleta.EmailContacto || record.EmailContacto || '',
            DireccionRecibo: familiaCompleta.DireccionRecibo || record.Direccion || '',
          };
          setFamiliaData(familiaFromAPI);
        } catch (error) {
          const familiaFromRecord = {
            IdFamilia: record.IdFamilia,
            NombreFamilia: record.NombreFamilia,
            NombreRecibo: '',
            TelefonoRecibo: record.TelefonoContacto || '',
            CorreoElectronico: record.EmailContacto || '',
            DireccionRecibo: record.Direccion || '',
          };
          setFamiliaData(familiaFromRecord);
        }
      }

      setOpenBuscar(false);
    } catch (error) {
      message.error('Error al cargar los datos del alumno');
    } finally {
      setLoading(false);
    }
  };

  const recargarDatosAlumno = async () => {
    try {
      const cicloEscolarActual = cicloEscolar || inscripcionData?.CicloEscolar || alumnoData?.CicloEscolar;

      if (!cicloEscolarActual) {
        return;
      }

      const response = await apiClient.get('/inscripciones/buscar-alumno', {
        params: {
          IdAlumno: alumnoData.IdAlumno,
          CicloEscolar: cicloEscolarActual
        }
      });

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const primerElemento = response.data.data[0];
        const alumnoActualizado = primerElemento["0"] || primerElemento;

        // Actualizar estados
        setAlumnoData(alumnoActualizado);
        setInscripcionData(alumnoActualizado);

        if (alumnoActualizado.CicloEscolar) {
          setCicloEscolar(alumnoActualizado.CicloEscolar);
        }

        setMatricula(alumnoActualizado.Matricula || '');
        setNombres(alumnoActualizado.Nombres || '');
        setApellidos(alumnoActualizado.Apellidos || '');
        setFechaNacimiento(alumnoActualizado.FechaNacimiento ? moment(alumnoActualizado.FechaNacimiento) : null);
        setGenero(alumnoActualizado.Genero || '');
        setComunidadLinguistica(alumnoActualizado.ComunidadLinguistica || '');
        setNumeroEmergencia(alumnoActualizado.NumeroEmergencia || '');
        setNombreEmergencia(alumnoActualizado.ContactoEmergencia || '');
        setVisible(alumnoActualizado.Visible !== false);

        setIdGrado(alumnoActualizado.IdGrado || null);
        setIdSeccion(alumnoActualizado.IdSeccion || null);
        setIdJornada(alumnoActualizado.IdJornada || null);

        // Limpiar campos de cambio después de inicio
        setIdSeccionNueva(null);
        setIdJornadaNueva(null);
        setUnidadActual(null);
        setMotivoCambio('');

        const esActivo = alumnoActualizado.Estado === undefined || alumnoActualizado.Estado === null ||
                        alumnoActualizado.Estado === 1 || alumnoActualizado.Estado === 'Activo' ||
                        alumnoActualizado.Estado === true;
        setInscripcionActiva(esActivo);
        setObservacion(alumnoActualizado.ComentarioEstado || '');

        // Recargar familia
        if (alumnoActualizado.IdFamilia) {
          try {
            const familiaResponse = await apiClient.get(`/familias/${alumnoActualizado.IdFamilia}`);
            const familiaCompleta = familiaResponse.data.data || familiaResponse.data;

            const familiaActualizada = {
              IdFamilia: alumnoActualizado.IdFamilia,
              NombreFamilia: alumnoActualizado.NombreFamilia,
              NombreRecibo: familiaCompleta.NombreRecibo || '',
              TelefonoRecibo: familiaCompleta.TelefonoContacto || alumnoActualizado.TelefonoContacto || '',
              CorreoElectronico: familiaCompleta.EmailContacto || alumnoActualizado.EmailContacto || '',
              DireccionRecibo: familiaCompleta.DireccionRecibo || alumnoActualizado.Direccion || '',
            };
            setFamiliaData(familiaActualizada);
          } catch (error) {
          }
        }

      }
    } catch (error) {
    }
  };

  const handleGuardarDatosAlumno = async () => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const IdColaborador = userFromStorage.IdUsuario;

    if (!IdColaborador) {
      message.error('No se encontró el usuario en sesión. Por favor, recarga la página.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(`/alumnos/${alumnoData.IdAlumno}`, {
        Matricula: matricula,
        Nombres: nombres,
        Apellidos: apellidos,
        FechaNacimiento: fechaNacimiento ? fechaNacimiento.format('YYYY-MM-DD') : null,
        Genero: genero,
        ComunidadLinguistica: comunidadLinguistica,
        ContactoEmergencia: nombreEmergencia,
        NumeroEmergencia: numeroEmergencia,
        Visible: visible,
        Estado: visible ? 1 : 0,
        IdColaborador,
      });

      await registrarBitacora(
        'Edición de Alumno',
        `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}`
      );

      message.success({
        content: 'Datos del alumno actualizados con éxito.',
        duration: 5,
      });

      await recargarDatosAlumno();
    } catch (error) {
      message.error('Error al guardar los cambios del alumno. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar cambios ANTES de inicio de actividades (cambio directo de inscripción)
  const handleGuardarCambioAntesInicio = async () => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const IdColaborador = userFromStorage.IdUsuario;

    if (!IdColaborador) {
      message.error('No se encontró el usuario en sesión.');
      return;
    }

    setLoading(true);
    try {
      // Actualizar inscripción directamente
      if (inscripcionData.IdInscripcion) {
        await apiClient.put(`/inscripciones/${inscripcionData.IdInscripcion}`, {
          IdGrado: idGrado,
          IdSeccion: idSeccion,
          IdJornada: idJornada,
          IdColaborador,
        });
      }

      await registrarBitacora(
        'Cambio de Grado/Sección/Jornada (Antes de Inicio)',
        `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}`
      );

      message.success('Cambio de grado, sección y/o jornada guardado correctamente.');
      await recargarDatosAlumno();
    } catch (error) {
      message.error('Error al guardar los cambios. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Guardar cambios DESPUÉS de inicio de actividades (usa endpoint cambiar-grupo)
  const handleGuardarCambioDespuesInicio = async () => {
    // Validaciones
    if (!idSeccionNueva && !idJornadaNueva) {
      message.warning('Debes seleccionar al menos una nueva sección o jornada.');
      return;
    }

    if (!unidadActual) {
      message.warning('Debes seleccionar la unidad que se está cursando actualmente.');
      return;
    }

    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const IdColaborador = userFromStorage.IdUsuario;

    if (!IdColaborador) {
      message.error('No se encontró el usuario en sesión.');
      return;
    }

    setLoadingCambioGrupo(true);
    try {
      const payload = {
        IdInscripcion: inscripcionData.IdInscripcion,
        IdColaborador,
        NumeroUnidadActual: unidadActual,
        Motivo: motivoCambio || 'Cambio de sección/jornada',
      };

      if (idSeccionNueva) {
        payload.IdSeccionNueva = idSeccionNueva;
      }
      if (idJornadaNueva) {
        payload.IdJornadaNueva = idJornadaNueva;
      }


      const response = await apiClient.post('/inscripciones/cambiar-grupo', payload);


      if (response.data.success) {
        await registrarBitacora(
          'Cambio de Sección/Jornada (Después de Inicio)',
          `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}. ${response.data.message}`
        );

        message.success({
          content: (
            <div>
              <strong>Cambio realizado exitosamente</strong>
              <br />
              <small>{response.data.message}</small>
            </div>
          ),
          duration: 8,
        });

        await recargarDatosAlumno();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al realizar el cambio de grupo.';
      message.error(errorMsg);
    } finally {
      setLoadingCambioGrupo(false);
    }
  };

  // Guardar suspensión de alumno
  const handleGuardarSuspension = async () => {
    if (!inscripcionActiva && !observacion.trim()) {
      message.error('Debes ingresar el motivo de la suspensión.');
      return;
    }

    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const IdColaborador = userFromStorage.IdUsuario;

    if (!IdColaborador) {
      message.error('No se encontró el usuario en sesión.');
      return;
    }

    setLoading(true);
    try {
      if (inscripcionData.IdInscripcion) {
        await apiClient.put(`/inscripciones/${inscripcionData.IdInscripcion}`, {
          Estado: inscripcionActiva ? 1 : 0,
          ComentarioEstado: inscripcionActiva ? '' : observacion,
          IdColaborador,
        });
      }

      if (!inscripcionActiva) {
        await registrarBitacora(
          'Suspensión de Alumno',
          `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}. Motivo: ${observacion}`
        );
        message.success('Alumno suspendido correctamente.');
      } else {
        await registrarBitacora(
          'Reactivación de Alumno',
          `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}`
        );
        message.success('Alumno reactivado correctamente.');
      }

      await recargarDatosAlumno();
    } catch (error) {
      message.error('Error al guardar los cambios.');
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

  // Obtener nombres de catálogos para mostrar
  const getNombreGrado = (id) => grados.find(g => g.IdGrado === id)?.NombreGrado || 'No asignado';
  const getNombreSeccion = (id) => secciones.find(s => s.IdSeccion === id)?.NombreSeccion || 'No asignada';
  const getNombreJornada = (id) => jornadas.find(j => j.IdJornada === id)?.NombreJornada || 'No asignada';

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
          <Card title="Datos del Alumno" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Código MINEDUC
                  </label>
                  <Input
                    placeholder="Código MINEDUC del alumno"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Fecha de Nacimiento
                  </label>
                  <DatePicker
                    style={{ width: '100%' }}
                    placeholder="DD/MM/AAAA"
                    format="DD/MM/YYYY"
                    value={fechaNacimiento}
                    onChange={(date) => setFechaNacimiento(date)}
                  />
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Nombres
                  </label>
                  <Input
                    placeholder="Nombres del alumno"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Apellidos
                  </label>
                  <Input
                    placeholder="Apellidos del alumno"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                  />
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Género
                  </label>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Seleccione el género"
                    value={genero}
                    onChange={(value) => setGenero(value)}
                  >
                    <Option value="M">Masculino</Option>
                    <Option value="F">Femenino</Option>
                  </Select>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Comunidad Lingüística
                  </label>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Seleccione la comunidad"
                    value={comunidadLinguistica}
                    onChange={(value) => setComunidadLinguistica(value)}
                  >
                    <Option value="Mam">Mam</Option>
                    <Option value="Ladino">Ladino</Option>
                  </Select>
                </div>
              </Col>
            </Row>
          </Card>

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

          <Row justify="space-between" style={{ marginTop: 40 }}>
            <Col>
              <Button
                type="primary"
                size="large"
                style={{ minWidth: 240, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                onClick={handleGuardarDatosAlumno}
                loading={loading}
              >
                Guardar Datos del Alumno
              </Button>
            </Col>
            <Col>
              <Button type="primary" size="large" onClick={() => setActiveTab('2')}>
                Siguiente →
              </Button>
            </Col>
          </Row>
        </Tabs.TabPane>

        {/* PESTAÑA 2 - INSCRIPCIÓN */}
        <Tabs.TabPane tab="2. Inscripción" key="2">
          <Tabs
            activeKey={activeSubTab}
            onChange={setActiveSubTab}
            type="card"
            style={{ marginBottom: 16 }}
          >
            {/* SUB-PESTAÑA: CAMBIO ANTES DE INICIO */}
            <Tabs.TabPane
              tab={
                <span>
                  <SwapOutlined /> Cambio antes de inicio de actividades
                </span>
              }
              key="antes"
            >
              <Card>
                <Alert
                  message="Cambio de Grado, Sección o Jornada"
                  description="Este cambio es para realizar ajustes ANTES de que inicien las actividades del ciclo escolar. No afecta calificaciones existentes."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {/* Información actual */}
                <div style={{ marginBottom: 24, padding: 16, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff' }}>
                  <Title level={5} style={{ marginBottom: 16 }}>Información Actual</Title>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text strong>Grado: </Text>
                      <Tag color="blue" style={{ fontSize: 14 }}>{inscripcionData?.NombreGrado || getNombreGrado(inscripcionData?.IdGrado)}</Tag>
                    </Col>
                    <Col span={8}>
                      <Text strong>Sección: </Text>
                      <Tag color="green" style={{ fontSize: 14 }}>{inscripcionData?.NombreSeccion || getNombreSeccion(inscripcionData?.IdSeccion)}</Tag>
                    </Col>
                    <Col span={8}>
                      <Text strong>Jornada: </Text>
                      <Tag color="orange" style={{ fontSize: 14 }}>{inscripcionData?.NombreJornada || getNombreJornada(inscripcionData?.IdJornada)}</Tag>
                    </Col>
                  </Row>
                </div>

                <Divider>Seleccionar nuevos valores</Divider>

                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Grado</label>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Seleccionar grado"
                        value={idGrado}
                        onChange={setIdGrado}
                      >
                        {grados.map((g) => (
                          <Option key={g.IdGrado} value={g.IdGrado}>
                            {g.NombreGrado}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Sección</label>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Seleccionar sección"
                        value={idSeccion}
                        onChange={setIdSeccion}
                      >
                        {secciones.map((s) => (
                          <Option key={s.IdSeccion} value={s.IdSeccion}>
                            {s.NombreSeccion}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Jornada</label>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Seleccionar jornada"
                        value={idJornada}
                        onChange={setIdJornada}
                      >
                        {jornadas.map((j) => (
                          <Option key={j.IdJornada} value={j.IdJornada}>
                            {j.NombreJornada}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                </Row>

                <Row justify="end" style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleGuardarCambioAntesInicio}
                    loading={loading}
                  >
                    Guardar Cambios
                  </Button>
                </Row>
              </Card>
            </Tabs.TabPane>

            {/* SUB-PESTAÑA: CAMBIO DESPUÉS DE INICIO */}
            <Tabs.TabPane
              tab={
                <span>
                  <SwapOutlined /> Cambio después de inicio de actividades
                </span>
              }
              key="despues"
            >
              <Card>
                <Alert
                  message="Cambio de Sección o Jornada con Traspaso de Calificaciones"
                  description="Este cambio realiza un traspaso de actividades y calificaciones. Solo permite cambiar Sección y/o Jornada (el Grado NO se puede cambiar después de iniciadas las actividades)."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {/* Información actual */}
                <div style={{ marginBottom: 24, padding: 16, background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
                  <Title level={5} style={{ marginBottom: 16 }}>Información Actual</Title>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text strong>Grado: </Text>
                      <Tag color="blue" style={{ fontSize: 14 }}>{inscripcionData?.NombreGrado || getNombreGrado(inscripcionData?.IdGrado)}</Tag>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>(No modificable)</Text>
                    </Col>
                    <Col span={8}>
                      <Text strong>Sección: </Text>
                      <Tag color="green" style={{ fontSize: 14 }}>{inscripcionData?.NombreSeccion || getNombreSeccion(inscripcionData?.IdSeccion)}</Tag>
                    </Col>
                    <Col span={8}>
                      <Text strong>Jornada: </Text>
                      <Tag color="orange" style={{ fontSize: 14 }}>{inscripcionData?.NombreJornada || getNombreJornada(inscripcionData?.IdJornada)}</Tag>
                    </Col>
                  </Row>
                </div>

                <Divider>Seleccionar nuevos valores</Divider>

                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Nueva Sección <Text type="secondary">(opcional)</Text>
                      </label>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Seleccionar nueva sección"
                        value={idSeccionNueva}
                        onChange={setIdSeccionNueva}
                        allowClear
                      >
                        {secciones.map((s) => (
                          <Option key={s.IdSeccion} value={s.IdSeccion}>
                            {s.NombreSeccion}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Nueva Jornada <Text type="secondary">(opcional)</Text>
                      </label>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Seleccionar nueva jornada"
                        value={idJornadaNueva}
                        onChange={setIdJornadaNueva}
                        allowClear
                      >
                        {jornadas.map((j) => (
                          <Option key={j.IdJornada} value={j.IdJornada}>
                            {j.NombreJornada}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                        Unidad Actual <Text type="danger">*</Text>
                      </label>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="Seleccionar unidad que se cursa"
                        value={unidadActual}
                        onChange={setUnidadActual}
                      >
                        {unidades.map((u) => (
                          <Option key={u.value} value={u.value}>
                            {u.label}
                          </Option>
                        ))}
                      </Select>
                    </div>
                  </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                    Motivo del cambio <Text type="secondary">(opcional)</Text>
                  </label>
                  <TextArea
                    rows={3}
                    placeholder="Ej: Balanceo de grupos, cambio de horario de padres, etc."
                    value={motivoCambio}
                    onChange={(e) => setMotivoCambio(e.target.value)}
                  />
                </div>

                {/* Advertencia */}
                {unidadActual && (
                  <Alert
                    message={<Text strong><WarningOutlined /> Importante</Text>}
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>Se eliminarán las calificaciones de la <strong>{unidades.find(u => u.value === unidadActual)?.label}</strong> del grupo anterior.</li>
                        <li>Se crearán calificaciones para <strong>todas las unidades</strong> del nuevo grupo.</li>
                        <li>Las calificaciones de unidades anteriores ya cerradas permanecerán en el grupo anterior.</li>
                      </ul>
                    }
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                )}

                <Row justify="end" style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleGuardarCambioDespuesInicio}
                    loading={loadingCambioGrupo}
                    disabled={!idSeccionNueva && !idJornadaNueva}
                  >
                    Realizar Cambio de Grupo
                  </Button>
                </Row>
              </Card>
            </Tabs.TabPane>

            {/* SUB-PESTAÑA: SUSPENSIÓN */}
            <Tabs.TabPane
              tab={
                <span>
                  <StopOutlined /> Suspensión de alumno
                </span>
              }
              key="suspension"
            >
              <Card>
                <Alert
                  message="Suspensión o Reactivación de Inscripción"
                  description="Utiliza esta opción para suspender temporalmente o reactivar la inscripción del alumno. Esto no elimina datos, solo marca la inscripción como inactiva."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                <div style={{ marginBottom: 24 }}>
                  <Space size="large">
                    <Switch
                      checked={inscripcionActiva}
                      onChange={setInscripcionActiva}
                      checkedChildren="Activa"
                      unCheckedChildren="Inactiva"
                      style={{ transform: 'scale(1.3)' }}
                    />
                    <Text strong style={{ fontSize: 16 }}>
                      {inscripcionActiva ? 'Inscripción Activa' : 'Inscripción Suspendida'}
                    </Text>
                  </Space>
                </div>

                {!inscripcionActiva && (
                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      Motivo de la suspensión <Text type="danger">*</Text>
                    </label>
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

                <Row justify="end" style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    size="large"
                    danger={!inscripcionActiva}
                    onClick={handleGuardarSuspension}
                    loading={loading}
                  >
                    {inscripcionActiva ? 'Guardar (Reactivar)' : 'Suspender Alumno'}
                  </Button>
                </Row>
              </Card>
            </Tabs.TabPane>
          </Tabs>

          {/* Botones de navegación */}
          <Row justify="start" style={{ marginTop: 40 }}>
            <Button size="large" onClick={() => setActiveTab('1')}>
              ← Atrás
            </Button>
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

// src/pages/dashboard/alumnos/EditarAlumno.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Tabs, Input, Select, Switch, Button, Space, Tag, Typography, Row, Col, message, Spin, DatePicker
} from 'antd';
import BuscarAlumnoEditarModal from './components/BuscarAlumnoEditarModal';
import EditarFamiliaModal from './components/EditarFamiliaModal';
import apiClient from '../../../api/apiClient';
import moment from 'moment';
import { registrarBitacora } from '../../../utils/bitacora';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
  const [cicloEscolar, setCicloEscolar] = useState(null); // Estado separado para CicloEscolar

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

  // Estados editables de inscripción
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
      console.log('🔍 CicloEscolar en record:', record.CicloEscolar);

      // Guardar datos del alumno
      setAlumnoData(record);
      setInscripcionData(record);

      // Guardar el ciclo escolar de manera independiente para usarlo en recargas
      if (record.CicloEscolar) {
        setCicloEscolar(record.CicloEscolar);
        console.log('✅ CicloEscolar guardado:', record.CicloEscolar);
      } else {
        console.warn('⚠️ ADVERTENCIA: No se encontró CicloEscolar en el record');
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

      // Establecer valores de sección y jornada
      // Si vienen los IDs directamente del SP, usarlos. Si no, intentar mapear por nombre
      setIdSeccion(record.IdSeccion || null);
      setIdJornada(record.IdJornada || null);

      // Estado activo por defecto (1 = Activo, 0 = Inactivo)
      const esActivo = record.Estado === undefined || record.Estado === null || record.Estado === 1 || record.Estado === 'Activo' || record.Estado === true;
      setInscripcionActiva(esActivo);
      setObservacion(record.ComentarioEstado || '');

      // Cargar datos completos de familia desde el endpoint
      if (record.IdFamilia) {
        try {
          const familiaResponse = await apiClient.get(`/familias/${record.IdFamilia}`);
          const familiaCompleta = familiaResponse.data.data || familiaResponse.data;

          const familiaFromAPI = {
            IdFamilia: record.IdFamilia,
            NombreFamilia: record.NombreFamilia,
            NombreRecibo: familiaCompleta.NombreRecibo || '', // Campo real de facturación (DPI/NIT)
            TelefonoRecibo: familiaCompleta.TelefonoContacto || record.TelefonoContacto || '',
            CorreoElectronico: familiaCompleta.EmailContacto || record.EmailContacto || '',
            DireccionRecibo: familiaCompleta.DireccionRecibo || record.Direccion || '',
          };
          setFamiliaData(familiaFromAPI);
          console.log('FAMILIA CARGADA DESDE API:', familiaFromAPI);
        } catch (error) {
          console.error('Error al cargar datos de familia:', error);
          // Fallback a datos del SP si falla la llamada
          const familiaFromRecord = {
            IdFamilia: record.IdFamilia,
            NombreFamilia: record.NombreFamilia,
            NombreRecibo: '',
            TelefonoRecibo: record.TelefonoContacto || '',
            CorreoElectronico: record.EmailContacto || '',
            DireccionRecibo: record.Direccion || '',
          };
          setFamiliaData(familiaFromRecord);
          console.log('FAMILIA MAPEADA DESDE RECORD (FALLBACK):', familiaFromRecord);
        }
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

  const recargarDatosAlumno = async () => {
    console.log('🔄 Iniciando recarga de datos del alumno...');
    console.log('📋 Datos actuales:', {
      IdAlumno: alumnoData.IdAlumno,
      CicloEscolar_state: cicloEscolar,
      CicloEscolar_inscripcion: inscripcionData?.CicloEscolar,
      CicloEscolar_alumno: alumnoData?.CicloEscolar,
      inscripcionData: inscripcionData
    });

    try {
      // Usar el ciclo escolar del estado guardado (más confiable)
      const cicloEscolarActual = cicloEscolar || inscripcionData?.CicloEscolar || alumnoData?.CicloEscolar;

      if (!cicloEscolarActual) {
        console.error('❌ No se encontró el ciclo escolar en ningún lugar');
        message.error('No se pudo determinar el ciclo escolar para recargar los datos');
        return;
      }

      console.log('✅ Usando CicloEscolar:', cicloEscolarActual);

      // Buscar el alumno actualizado en inscripciones
      const response = await apiClient.get('/inscripciones/buscar-alumno', {
        params: {
          IdAlumno: alumnoData.IdAlumno,
          CicloEscolar: cicloEscolarActual
        }
      });

      console.log('📥 Respuesta del servidor:', response.data);

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // La respuesta viene en formato: data[0]["0"] = alumno
        const primerElemento = response.data.data[0];
        const alumnoActualizado = primerElemento["0"] || primerElemento;

        console.log('📝 Datos actualizados recibidos:', {
          IdSeccion: alumnoActualizado.IdSeccion,
          NombreSeccion: alumnoActualizado.NombreSeccion,
          IdJornada: alumnoActualizado.IdJornada,
          NombreJornada: alumnoActualizado.NombreJornada
        });

        // Actualizar todos los estados con los datos frescos
        setAlumnoData(alumnoActualizado);
        setInscripcionData(alumnoActualizado);

        // Actualizar CicloEscolar también si viene en la respuesta
        if (alumnoActualizado.CicloEscolar) {
          setCicloEscolar(alumnoActualizado.CicloEscolar);
        }

        // Actualizar campos del alumno
        setMatricula(alumnoActualizado.Matricula || '');
        setNombres(alumnoActualizado.Nombres || '');
        setApellidos(alumnoActualizado.Apellidos || '');
        setFechaNacimiento(alumnoActualizado.FechaNacimiento ? moment(alumnoActualizado.FechaNacimiento) : null);
        setGenero(alumnoActualizado.Genero || '');
        setComunidadLinguistica(alumnoActualizado.ComunidadLinguistica || '');
        setNumeroEmergencia(alumnoActualizado.NumeroEmergencia || '');
        setNombreEmergencia(alumnoActualizado.ContactoEmergencia || '');
        setVisible(alumnoActualizado.Visible !== false);

        // Actualizar campos de inscripción
        setIdSeccion(alumnoActualizado.IdSeccion || null);
        setIdJornada(alumnoActualizado.IdJornada || null);

        const esActivo = alumnoActualizado.Estado === undefined || alumnoActualizado.Estado === null ||
                        alumnoActualizado.Estado === 1 || alumnoActualizado.Estado === 'Activo' ||
                        alumnoActualizado.Estado === true;
        setInscripcionActiva(esActivo);
        setObservacion(alumnoActualizado.ComentarioEstado || '');

        // Recargar datos de familia si existe IdFamilia
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
            console.error('Error al recargar familia:', error);
          }
        }

        console.log('✅ Datos del alumno recargados correctamente');
      } else {
        console.warn('⚠️ No se encontraron datos actualizados del alumno');
      }
    } catch (error) {
      console.error('❌ Error al recargar datos del alumno:', error);
      // No mostrar error al usuario, los datos antiguos siguen válidos
    }
  };

  const handleGuardarDatosAlumno = async () => {
    // Obtener IdColaborador del localStorage
    const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
    const IdColaborador = userFromStorage.IdUsuario;

    if (!IdColaborador) {
      message.error('No se encontró el usuario en sesión. Por favor, recarga la página.');
      return;
    }

    console.log('IdColaborador obtenido para guardar datos del alumno:', IdColaborador);

    setLoading(true);
    try {
      // Actualizar solo datos del alumno
      const alumnoResponse = await apiClient.put(`/alumnos/${alumnoData.IdAlumno}`, {
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
      console.log('Respuesta actualización alumno:', alumnoResponse.data);

      // Registrar en bitácora
      await registrarBitacora(
        'Edición de Alumno',
        `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}`
      );

      // Mostrar mensaje de éxito
      message.success({
        content: 'Datos del alumno actualizados con éxito.',
        duration: 5,
      });

      // Recargar los datos actualizados del alumno
      await recargarDatosAlumno();
    } catch (error) {
      console.error('ERROR AL GUARDAR DATOS DEL ALUMNO:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      message.error('Error al guardar los cambios del alumno. Intenta nuevamente.');
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

      console.log('✅ Guardado exitoso');

      // Registrar en bitácora
      if (!inscripcionActiva) {
        // Si la inscripción está inactiva, es una suspensión
        await registrarBitacora(
          'Suspensión de Alumno',
          `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}. Motivo: ${observacion}`
        );
      } else {
        // Si no, es solo una edición
        await registrarBitacora(
          'Edición de Alumno',
          `Alumno ID: ${alumnoData.IdAlumno} - ${nombres} ${apellidos}`
        );
      }

      // Mostrar mensaje de éxito
      message.success({
        content: 'Estudiante actualizado con éxito. Los cambios se han guardado correctamente.',
        duration: 5,
      });

      console.log('💬 Mensaje de éxito mostrado');

      // Recargar los datos actualizados del alumno
      console.log('🔄 Llamando a recargarDatosAlumno...');
      await recargarDatosAlumno();
      console.log('✅ Recarga completada');
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

          {/* BOTONES GUARDAR Y SIGUIENTE */}
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
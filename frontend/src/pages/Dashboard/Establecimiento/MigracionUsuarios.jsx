import React, { useState, useEffect } from 'react';
import { Card, Button, message, Typography, Statistic, Row, Col, Alert, Progress, List, Tag, Space, Modal } from 'antd';
import { UserAddOutlined, TeamOutlined, ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { confirm } = Modal;

const MigracionUsuarios = () => {
  const [alumnosSinUsuario, setAlumnosSinUsuario] = useState([]);
  const [familiasSinUsuario, setFamiliasSinUsuario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [procesandoAlumnos, setProcesandoAlumnos] = useState(false);
  const [procesandoFamilias, setProcesandoFamilias] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [logs, setLogs] = useState([]);

  // Obtener IdColaborador del usuario actual
  const getIdColaborador = () => {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    const user = JSON.parse(userString);
    return user.IdUsuario;
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar alumnos sin usuario
      const alumnosRes = await apiClient.get('/alumnos?sinUsuario=true');
      const alumnosData = alumnosRes.data?.data || alumnosRes.data || [];
      setAlumnosSinUsuario(Array.isArray(alumnosData) ? alumnosData : []);

      // Cargar familias sin usuario
      const familiasRes = await apiClient.get('/familias?sinUsuario=true');
      const familiasData = familiasRes.data?.data || familiasRes.data || [];
      setFamiliasSinUsuario(Array.isArray(familiasData) ? familiasData : []);

      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      message.error('Error al cargar la información');
      setLoading(false);
    }
  };

  const agregarLog = (tipo, mensaje) => {
    const nuevoLog = {
      tipo, // 'success', 'error', 'info'
      mensaje,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [nuevoLog, ...prev]);
  };

  const migrarAlumnos = async () => {
    confirm({
      title: '¿Confirmar migración de usuarios para alumnos?',
      icon: <ExclamationCircleOutlined />,
      content: `Se crearán ${alumnosSinUsuario.length} usuarios para alumnos. Esta operación no se puede revertir fácilmente.`,
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setProcesandoAlumnos(true);
        setProgreso(0);
        setLogs([]);

        const idColaborador = getIdColaborador();
        if (!idColaborador) {
          message.error('No se pudo obtener el ID del colaborador');
          setProcesandoAlumnos(false);
          return;
        }

        let exitosos = 0;
        let errores = 0;

        for (let i = 0; i < alumnosSinUsuario.length; i++) {
          const alumno = alumnosSinUsuario[i];

          try {
            // 1. Crear usuario
            const usuarioRes = await apiClient.post('/usuarios', {
              NombreUsuario: String(alumno.IdAlumno),
              NombreCompleto: `${alumno.Nombres} ${alumno.Apellidos}`,
              Contrasena: String(alumno.IdAlumno),
              IdRol: 5, // Rol Estudiante
              IdColaborador: idColaborador
            });

            const idUsuario = usuarioRes.data?.data?.IdUsuario || usuarioRes.data?.IdUsuario;

            if (!idUsuario) {
              throw new Error('No se recibió IdUsuario en la respuesta');
            }

            // 2. Asignar usuario al alumno
            await apiClient.put(`/alumnos/${alumno.IdAlumno}`, {
              IdUsuario: idUsuario,
              IdColaborador: idColaborador
            });

            exitosos++;
            agregarLog('success', `✅ ${alumno.Nombres} ${alumno.Apellidos} (${alumno.IdAlumno})`);
          } catch (error) {
            errores++;
            const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
            agregarLog('error', `❌ ${alumno.Nombres} ${alumno.Apellidos}: ${errorMsg}`);
            console.error(`Error con alumno ${alumno.IdAlumno}:`, error);
          }

          // Actualizar progreso
          setProgreso(Math.round(((i + 1) / alumnosSinUsuario.length) * 100));
        }

        setProcesandoAlumnos(false);
        setProgreso(100);

        if (exitosos > 0) {
          message.success(`Migración completada: ${exitosos} usuarios creados${errores > 0 ? `, ${errores} errores` : ''}`);
          cargarDatos(); // Recargar datos
        } else {
          message.error('No se pudo crear ningún usuario');
        }
      }
    });
  };

  const migrarFamilias = async () => {
    confirm({
      title: '¿Confirmar migración de usuarios para familias?',
      icon: <ExclamationCircleOutlined />,
      content: `Se crearán ${familiasSinUsuario.length} usuarios para familias. Esta operación no se puede revertir fácilmente.`,
      okText: 'Confirmar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setProcesandoFamilias(true);
        setProgreso(0);
        setLogs([]);

        const idColaborador = getIdColaborador();
        if (!idColaborador) {
          message.error('No se pudo obtener el ID del colaborador');
          setProcesandoFamilias(false);
          return;
        }

        let exitosos = 0;
        let errores = 0;

        for (let i = 0; i < familiasSinUsuario.length; i++) {
          const familia = familiasSinUsuario[i];

          try {
            // 1. Obtener hijos de la familia
            const hijosRes = await apiClient.get(`/alumnos?idFamilia=${familia.IdFamilia}`);
            const hijos = hijosRes.data?.data || hijosRes.data || [];

            if (hijos.length === 0) {
              throw new Error('La familia no tiene hijos registrados');
            }

            // 2. Obtener el hijo más reciente (mayor IdAlumno)
            const hijoMasReciente = hijos.reduce((max, hijo) =>
              hijo.IdAlumno > max.IdAlumno ? hijo : max
            , hijos[0]);

            // 3. Crear nombre de usuario basado en apellidos
            const apellidos = hijoMasReciente.Apellidos.trim().toLowerCase().replace(/\s+/g, '_');
            const nombreUsuario = `familia_${apellidos}`;

            // 4. Crear usuario
            const usuarioRes = await apiClient.post('/usuarios', {
              NombreUsuario: nombreUsuario,
              NombreCompleto: familia.NombreFamilia,
              Contrasena: String(hijoMasReciente.IdAlumno),
              IdRol: 3, // Rol Familia
              IdColaborador: idColaborador
            });

            const idUsuario = usuarioRes.data?.data?.IdUsuario || usuarioRes.data?.IdUsuario;

            if (!idUsuario) {
              throw new Error('No se recibió IdUsuario en la respuesta');
            }

            // 5. Asignar usuario a la familia
            await apiClient.put(`/familias/${familia.IdFamilia}`, {
              IdUsuario: idUsuario,
              IdColaborador: idColaborador
            });

            exitosos++;
            agregarLog('success', `✅ ${familia.NombreFamilia} (Usuario: ${nombreUsuario}, Contraseña: ${hijoMasReciente.IdAlumno})`);
          } catch (error) {
            errores++;
            const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
            agregarLog('error', `❌ ${familia.NombreFamilia}: ${errorMsg}`);
            console.error(`Error con familia ${familia.IdFamilia}:`, error);
          }

          // Actualizar progreso
          setProgreso(Math.round(((i + 1) / familiasSinUsuario.length) * 100));
        }

        setProcesandoFamilias(false);
        setProgreso(100);

        if (exitosos > 0) {
          message.success(`Migración completada: ${exitosos} usuarios creados${errores > 0 ? `, ${errores} errores` : ''}`);
          cargarDatos(); // Recargar datos
        } else {
          message.error('No se pudo crear ningún usuario');
        }
      }
    });
  };

  const exportarLogs = () => {
    if (logs.length === 0) {
      message.warning('No hay logs para exportar');
      return;
    }

    const datosExcel = logs.map((log) => ({
      'Hora': log.timestamp,
      'Tipo': log.tipo === 'success' ? 'Éxito' : log.tipo === 'error' ? 'Error' : 'Info',
      'Mensaje': log.mensaje
    }));

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Migracion_Usuarios_${fecha}.xlsx`);

    message.success('Logs exportados exitosamente');
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <UserAddOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Migración de Usuarios
        </Title>
        <Text type="secondary">
          Crea usuarios masivamente para alumnos y familias que aún no tienen credenciales de acceso
        </Text>
      </div>

      {/* Advertencia */}
      <Alert
        message="⚠️ Advertencia Importante"
        description="Esta operación creará usuarios masivamente. Se recomienda hacer un respaldo de la base de datos antes de proceder. La operación no se puede revertir fácilmente."
        type="warning"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Alumnos sin Usuario"
              value={alumnosSinUsuario.length}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title="Familias sin Usuario"
              value={familiasSinUsuario.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Sección Alumnos */}
      <Card
        title="👨‍🎓 Crear Usuarios para Alumnos"
        style={{ marginBottom: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text>Se creará un usuario por cada alumno con:</Text>
            <ul>
              <li><Text strong>Usuario:</Text> IdAlumno del alumno (ej: 20260013)</li>
              <li><Text strong>Contraseña:</Text> IdAlumno del alumno (mismo valor)</li>
              <li><Text strong>Rol:</Text> Estudiante</li>
            </ul>
          </div>

          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="large"
            onClick={migrarAlumnos}
            disabled={alumnosSinUsuario.length === 0 || procesandoAlumnos || procesandoFamilias}
            loading={procesandoAlumnos}
          >
            {procesandoAlumnos
              ? `Procesando... (${progreso}%)`
              : `Crear ${alumnosSinUsuario.length} Usuarios para Alumnos`
            }
          </Button>

          {procesandoAlumnos && (
            <Progress percent={progreso} status="active" />
          )}
        </Space>
      </Card>

      {/* Sección Familias */}
      <Card
        title="👨‍👩‍👧‍👦 Crear Usuarios para Familias"
        style={{ marginBottom: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text>Se creará un usuario por cada familia con:</Text>
            <ul>
              <li><Text strong>Usuario:</Text> "familia_" + apellidos del hijo (ej: familia_perez)</li>
              <li><Text strong>Contraseña:</Text> IdAlumno del hijo más reciente</li>
              <li><Text strong>Rol:</Text> Familia</li>
            </ul>
          </div>

          <Button
            type="primary"
            icon={<TeamOutlined />}
            size="large"
            onClick={migrarFamilias}
            disabled={familiasSinUsuario.length === 0 || procesandoAlumnos || procesandoFamilias}
            loading={procesandoFamilias}
          >
            {procesandoFamilias
              ? `Procesando... (${progreso}%)`
              : `Crear ${familiasSinUsuario.length} Usuarios para Familias`
            }
          </Button>

          {procesandoFamilias && (
            <Progress percent={progreso} status="active" />
          )}
        </Space>
      </Card>

      {/* Logs */}
      {logs.length > 0 && (
        <Card
          title="📋 Registro de Operaciones"
          extra={
            <Button
              icon={<DownloadOutlined />}
              onClick={exportarLogs}
            >
              Exportar Logs
            </Button>
          }
        >
          <List
            size="small"
            dataSource={logs}
            style={{ maxHeight: '400px', overflow: 'auto' }}
            renderItem={(log) => (
              <List.Item>
                <Space>
                  {log.tipo === 'success' ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : log.tipo === 'error' ? (
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  ) : null}
                  <Text type="secondary">[{log.timestamp}]</Text>
                  <Text>{log.mensaje}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default MigracionUsuarios;

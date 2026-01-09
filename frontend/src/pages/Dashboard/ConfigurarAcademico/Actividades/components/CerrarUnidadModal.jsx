import { useState, useEffect } from 'react';
import { Modal, Button, Table, Statistic, Row, Col, Alert, Spin, message } from 'antd';
import {
  LockOutlined, WarningOutlined, CheckCircleOutlined,
  CloseCircleOutlined, TrophyOutlined
} from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';

const CerrarUnidadModal = ({ visible, onCancel, unidad, asignacion, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [validandoCierre, setValidandoCierre] = useState(false);
  const [datosValidacion, setDatosValidacion] = useState(null);
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    if (visible && unidad) {
      validarCierre();
    }
  }, [visible, unidad]);

  const validarCierre = async () => {
    setValidandoCierre(true);
    try {
      console.log('Validando cierre de unidad:', unidad.IdUnidad);
      const response = await apiClient.get(`/unidades/${unidad.IdUnidad}/validar-cierre`);
      console.log('Datos de validación recibidos:', response.data);

      if (response.data.success) {
        setDatosValidacion(response.data);
      } else {
        console.error('Error en validación:', response.data);
        message.error(response.data.error || 'Error al validar el cierre de la unidad');
      }
    } catch (error) {
      console.error('Error al validar cierre:', error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error('Error al validar el cierre de la unidad. Revisa la consola para más detalles.');
    } finally {
      setValidandoCierre(false);
    }
  };

  const handleCerrar = async () => {
    if (!datosValidacion?.puedeCerrar) {
      message.warning('La unidad no está lista para cerrarse');
      return;
    }

    setCerrando(true);
    try {
      console.log('Intentando cerrar unidad:', unidad.IdUnidad);
      const response = await apiClient.post(`/unidades/${unidad.IdUnidad}/cerrar`);
      console.log('Respuesta del backend al cerrar:', response.data);

      if (response.data.success) {
        const notasRegistradas = response.data.data?.notasRegistradas || 0;
        const estadisticas = response.data.data?.estadisticas || {};

        message.success({
          content: (
            <div>
              <div>{response.data.message || 'Unidad cerrada exitosamente'}</div>
              {notasRegistradas > 0 && (
                <div style={{ fontSize: '12px', marginTop: 4 }}>
                  Notas registradas: {notasRegistradas} |
                  Promedio: {estadisticas.promedio || 'N/A'} |
                  Aprobados: {estadisticas.aprobados || 0} |
                  Reprobados: {estadisticas.reprobados || 0}
                </div>
              )}
            </div>
          ),
          duration: 8
        });
        onSuccess?.();
        onCancel();
      } else {
        console.error('Backend retornó success:false:', response.data);
        message.error(response.data.error || 'Error al cerrar la unidad');
      }
    } catch (error) {
      console.error('Error al cerrar unidad:', error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      message.error({
        content: error.response?.data?.error || 'Error al cerrar la unidad. Revisa la consola para más detalles.',
        duration: 10
      });
    } finally {
      setCerrando(false);
    }
  };

  const columnas = [
    {
      title: 'Actividad',
      dataIndex: 'NombreActividad',
      key: 'NombreActividad',
      width: 250
    },
    {
      title: 'Alumnos sin Calificar',
      dataIndex: 'alumnosSinCalificar',
      key: 'alumnosSinCalificar',
      width: 150,
      align: 'center',
      render: (count) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {count}
        </span>
      )
    }
  ];

  const puedeCerrar = datosValidacion?.puedeCerrar;
  const estadisticas = datosValidacion?.estadisticas;
  const actividadesPendientes = datosValidacion?.actividadesPendientes || [];

  return (
    <Modal
      title={
        <span>
          <LockOutlined /> Cerrar Unidad
        </span>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          icon={<LockOutlined />}
          onClick={handleCerrar}
          loading={cerrando}
          disabled={!puedeCerrar}
        >
          Cerrar Unidad
        </Button>
      ]}
    >
      <Spin spinning={validandoCierre}>
        <div style={{ marginBottom: 16 }}>
          <h3>{unidad?.NombreUnidad}</h3>
          <p style={{ color: '#666' }}>
            {asignacion?.NombreCurso} - {asignacion?.NombreGrado} {asignacion?.NombreSeccion}
          </p>
        </div>

        {datosValidacion && (
          <>
            {puedeCerrar ? (
              <Alert
                message="La unidad está lista para cerrarse"
                description="Todas las actividades han sido calificadas. Al cerrar la unidad, se calcularán automáticamente las notas finales de todos los alumnos."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                message="La unidad NO está lista para cerrarse"
                description={datosValidacion.razon}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Estadísticas */}
            {estadisticas && (
              <div style={{
                marginBottom: 16,
                padding: 16,
                backgroundColor: '#f0f2f5',
                borderRadius: 4
              }}>
                <Row gutter={16}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Total Actividades"
                      value={estadisticas.totalActividades}
                      prefix={<TrophyOutlined />}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Total Alumnos"
                      value={estadisticas.totalAlumnos}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Calificaciones"
                      value={estadisticas.calificacionesCompletas}
                      suffix={`/ ${estadisticas.calificacionesEsperadas}`}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Progreso"
                      value={estadisticas.porcentajeCompletado}
                      suffix="%"
                      valueStyle={{
                        color: estadisticas.porcentajeCompletado === 100 ? '#3f8600' : '#cf1322'
                      }}
                    />
                  </Col>
                </Row>
              </div>
            )}

            {/* Actividades pendientes */}
            {actividadesPendientes.length > 0 && (
              <>
                <h4 style={{ marginTop: 16, marginBottom: 8 }}>
                  Actividades con calificaciones incompletas:
                </h4>
                <Table
                  columns={columnas}
                  dataSource={actividadesPendientes}
                  rowKey="IdActividad"
                  pagination={false}
                  size="small"
                  bordered
                />
              </>
            )}

            {/* Advertencia final */}
            {puedeCerrar && (
              <Alert
                message="¡Atención!"
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>
                      Al cerrar esta unidad:
                    </p>
                    <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                      <li>Se calcularán las notas finales (NotaZona + NotaFinal) redondeadas a enteros</li>
                      <li>Las notas se registrarán permanentemente en el sistema</li>
                      <li>No podrás modificar calificaciones hasta que un administrador apruebe una solicitud de reapertura</li>
                      <li>La unidad quedará marcada como inactiva</li>
                    </ul>
                  </div>
                }
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginTop: 16 }}
              />
            )}
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default CerrarUnidadModal;

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, InputNumber, message, Tag, Alert, Descriptions, Divider } from 'antd';
import { EditOutlined, CheckCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';

const ConfigurarUnidades = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalConfigVisible, setModalConfigVisible] = useState(false);
  const [unidadEditando, setUnidadEditando] = useState(null);
  const [form] = Form.useForm();

  const obtenerAnioEscolarInicial = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return (month >= 10) ? year + 1 : year;
  };

  const [anioFiltro, setAnioFiltro] = useState(obtenerAnioEscolarInicial());

  useEffect(() => {
    cargarAsignaciones();
  }, [anioFiltro]);

  const cargarAsignaciones = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/asignaciones?anio=${anioFiltro}`);
      if (response.data.success) {
        setAsignaciones(response.data.data);
      }
    } catch (error) {
      message.error('Error al cargar asignaciones');
    } finally {
      setLoading(false);
    }
  };

  const cargarUnidades = async (idAsignacion) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/unidades/asignacion/${idAsignacion}`);
      if (response.data.success) {
        setAsignacionSeleccionada(response.data.data.asignacion);
        setUnidades(response.data.data.unidades);
      }
    } catch (error) {
      message.error('Error al cargar unidades');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalConfig = (unidad) => {
    if (!unidad.puedeModificar) {
      message.warning(`Esta unidad ya tiene ${unidad.cantidadActividades} actividad(es). No se puede modificar la configuración.`);
      return;
    }
    setUnidadEditando(unidad);
    form.setFieldsValue({
      PunteoZona: unidad.PunteoZona,
      PunteoFinal: unidad.PunteoFinal
    });
    setModalConfigVisible(true);
  };

  const handleActualizarConfig = async (values) => {
    try {
      setLoading(true);
      const response = await apiClient.put(
        `/unidades/${unidadEditando.IdUnidad}/configuracion`,
        values
      );

      if (response.data.success) {
        message.success('Configuración actualizada exitosamente');
        setModalConfigVisible(false);
        form.resetFields();
        cargarUnidades(asignacionSeleccionada.idAsignacionDocente);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleActivarUnidad = async (idUnidad) => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/unidades/${idUnidad}/activar`);

      if (response.data.success) {
        message.success('Unidad activada exitosamente');
        cargarUnidades(asignacionSeleccionada.idAsignacionDocente);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al activar unidad';
      const detalle = error.response?.data?.detalle;

      if (detalle) {
        Modal.error({
          title: 'Error de validación',
          content: (
            <div>
              <p>{errorMsg}</p>
              <Divider />
              <p><strong>Punteo Zona:</strong> Configurado: {detalle.zona.configurado}, Actual: {detalle.zona.actual}</p>
              <p><strong>Punteo Final:</strong> Configurado: {detalle.final.configurado}, Actual: {detalle.final.actual}</p>
            </div>
          )
        });
      } else {
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const columnasAsignaciones = [
    {
      title: 'Curso',
      dataIndex: ['curso', 'Curso'],
      key: 'curso',
    },
    {
      title: 'Grado',
      dataIndex: ['grado', 'NombreGrado'],
      key: 'grado',
    },
    {
      title: 'Sección',
      dataIndex: ['seccion', 'NombreSeccion'],
      key: 'seccion',
    },
    {
      title: 'Jornada',
      dataIndex: ['jornada', 'NombreJornada'],
      key: 'jornada',
    },
    {
      title: 'Docente',
      key: 'docente',
      render: (_, record) => `${record.docente?.Nombres} ${record.docente?.Apellidos}`,
    },
    {
      title: 'Acción',
      key: 'accion',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => cargarUnidades(record.idAsignacionDocente)}
        >
          Ver Unidades
        </Button>
      ),
    },
  ];

  const columnasUnidades = [
    {
      title: 'Número',
      dataIndex: 'NumeroUnidad',
      key: 'numero',
      width: 80,
    },
    {
      title: 'Nombre',
      dataIndex: 'NombreUnidad',
      key: 'nombre',
    },
    {
      title: 'Punteo Zona',
      dataIndex: 'PunteoZona',
      key: 'zona',
      width: 120,
      render: (val) => <Tag color="blue">{val} pts</Tag>,
    },
    {
      title: 'Punteo Final',
      dataIndex: 'PunteoFinal',
      key: 'final',
      width: 120,
      render: (val) => <Tag color="green">{val} pts</Tag>,
    },
    {
      title: 'Actividades',
      dataIndex: 'cantidadActividades',
      key: 'actividades',
      width: 100,
      render: (val) => (
        <Tag color={val === 0 ? 'default' : 'orange'}>
          {val} {val === 1 ? 'actividad' : 'actividades'}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'Activa',
      key: 'activa',
      width: 100,
      render: (activa) => (
        activa ?
          <Tag icon={<CheckCircleOutlined />} color="success">Activa</Tag> :
          <Tag color="default">Inactiva</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => abrirModalConfig(record)}
            disabled={!record.puedeModificar}
          >
            Configurar
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleActivarUnidad(record.IdUnidad)}
            disabled={record.Activa === 1}
          >
            Activar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Configuración de Unidades"
        extra={
          <Space>
            <span>Año:</span>
            <InputNumber
              min={2020}
              max={2030}
              value={anioFiltro}
              onChange={setAnioFiltro}
            />
          </Space>
        }
      >
        {!asignacionSeleccionada ? (
          <>
            <Alert
              message="Seleccione una asignación para configurar sus unidades"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columnasAsignaciones}
              dataSource={asignaciones}
              loading={loading}
              rowKey="idAsignacionDocente"
              pagination={{ pageSize: 10 }}
            />
          </>
        ) : (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Curso">{asignacionSeleccionada.curso}</Descriptions.Item>
              <Descriptions.Item label="Grado">{asignacionSeleccionada.grado}</Descriptions.Item>
              <Descriptions.Item label="Sección">{asignacionSeleccionada.seccion}</Descriptions.Item>
              <Descriptions.Item label="Jornada">{asignacionSeleccionada.jornada}</Descriptions.Item>
              <Descriptions.Item label="Docente" span={2}>{asignacionSeleccionada.docente}</Descriptions.Item>
            </Descriptions>

            <Alert
              message="Instrucciones"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>Solo puede modificar la configuración de unidades que NO tengan actividades creadas</li>
                  <li>Los punteos de Zona y Final deben sumar exactamente 100 puntos</li>
                  <li>Solo una unidad puede estar activa a la vez</li>
                  <li>Para activar una unidad, las actividades deben coincidir con la configuración</li>
                </ul>
              }
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />

            <Button
              type="default"
              style={{ marginBottom: 16 }}
              onClick={() => setAsignacionSeleccionada(null)}
            >
              ← Volver a asignaciones
            </Button>

            <Table
              columns={columnasUnidades}
              dataSource={unidades}
              loading={loading}
              rowKey="IdUnidad"
              pagination={false}
            />
          </>
        )}
      </Card>

      <Modal
        title="Configurar Punteos de Unidad"
        open={modalConfigVisible}
        onCancel={() => {
          setModalConfigVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Alert
          message="Los punteos deben sumar 100 puntos"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleActualizarConfig}
        >
          <Form.Item
            label="Punteo Zona"
            name="PunteoZona"
            rules={[
              { required: true, message: 'Ingrese el punteo de zona' },
              { type: 'number', min: 0, max: 100, message: 'Debe estar entre 0 y 100' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              addonAfter="puntos"
              onChange={(val) => {
                if (val !== null) {
                  form.setFieldsValue({ PunteoFinal: 100 - val });
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="Punteo Final"
            name="PunteoFinal"
            rules={[
              { required: true, message: 'Ingrese el punteo final' },
              { type: 'number', min: 0, max: 100, message: 'Debe estar entre 0 y 100' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              addonAfter="puntos"
              onChange={(val) => {
                if (val !== null) {
                  form.setFieldsValue({ PunteoZona: 100 - val });
                }
              }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Guardar Configuración
              </Button>
              <Button onClick={() => {
                setModalConfigVisible(false);
                form.resetFields();
              }}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigurarUnidades;

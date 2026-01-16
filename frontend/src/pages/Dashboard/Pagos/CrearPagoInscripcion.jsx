import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Modal,
  Table,
  DatePicker,
  Card,
  Typography,
  InputNumber,
  Space
} from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarBitacora } from '../../../utils/bitacora';

const { Option } = Select;
const { Title, Text } = Typography;

const CrearPagoInscripcion = () => {
  const [form] = Form.useForm();
  const [alumnos, setAlumnos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [cicloEscolar, setCicloEscolar] = useState(getCicloActual());
  const [alumnoData, setAlumnoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaPago, setFechaPago] = useState(dayjs());
  const [montoInscripcion, setMontoInscripcion] = useState(200); // Monto por defecto
  const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null, rol: null };
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alumnosResponse, metodosPagoResponse] = await Promise.all([
          apiClient.get('/alumnos'),
          apiClient.get('/metodopagos'),
        ]);

        setAlumnos(alumnosResponse.data?.data || alumnosResponse.data || []);
        setMetodosPago(metodosPagoResponse.data?.data || metodosPagoResponse.data || []);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        message.error('Error al cargar datos: Revisa la conexión.');
      }
    };
    fetchData();
  }, []);

  const handleSearchAlumno = async () => {
    if (!selectedAlumno) {
      message.warning('Por favor selecciona un alumno.');
      return;
    }

    try {
      const response = await apiClient.get(
        `/inscripciones/buscar-alumno?IdAlumno=${encodeURIComponent(selectedAlumno)}&CicloEscolar=${encodeURIComponent(cicloEscolar)}`
      );

      if (response.data.success && response.data.data?.length > 0) {
        setAlumnoData(response.data.data);
      } else {
        setAlumnoData([]);
        message.warning('No se encontraron datos para el alumno en este ciclo.');
      }
    } catch (error) {
      console.error('Error al buscar alumno:', error);
      message.error('Error al buscar alumno');
      setAlumnoData([]);
    }
  };

  const handleRowDoubleClick = async (record) => {
    const data = record[0];
    const idAlumno = data.IdAlumno;

    form.setFieldsValue({
      IdAlumno: idAlumno,
      Nombres: `${data.Nombres} ${data.Apellidos}`,
      Grado: data.NombreGrado || '',
    });

    // Cargar datos de la familia para el recibo
    if (data.IdFamilia) {
      try {
        const familiaRes = await apiClient.get(`/familias/${encodeURIComponent(data.IdFamilia)}`);
        const familia = familiaRes.data.data || familiaRes.data;
        form.setFieldsValue({
          NombreRecibo: familia.NombreRecibo || familia.NombreFamilia || '',
          DireccionRecibo: familia.DireccionRecibo || familia.Direccion || '',
        });
      } catch (err) {
        form.setFieldsValue({
          NombreRecibo: data.NombreFamilia || '',
          DireccionRecibo: data.Direccion || '',
        });
      }
    }

    setIsSearchModalOpen(false);
    message.success('Alumno seleccionado correctamente');
  };

  const onFinish = async (values) => {
    const idAlumno = form.getFieldValue('IdAlumno');
    if (!idAlumno) {
      message.warning('Por favor selecciona un alumno.');
      return;
    }

    if (!montoInscripcion || montoInscripcion <= 0) {
      message.warning('El monto de inscripción debe ser mayor a 0.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        IdColaborador: user.IdUsuario,
        IdUsuario: user.IdUsuario,
        Fecha: fechaPago.format('YYYY-MM-DD'),
        IdAlumno: idAlumno,
        IdTipoPago: 3, // Tipo de pago: Inscripción
        Concepto: 'Inscripción',
        IdMetodoPago: values.IdMetodoPago || 1,
        Monto: montoInscripcion,
        NumeroRecibo: values.NumeroRecibo || null,
        Estado: true,
        NombreRecibo: values.NombreRecibo || null,
        DireccionRecibo: values.DireccionRecibo || null,
        Anio: getCicloActual(),
      };

      console.log('📦 Enviando pago de inscripción:', payload);

      const response = await apiClient.post('/pagos', payload);
      console.log('✅ Respuesta:', response.data);

      message.success('Pago de inscripción registrado exitosamente.');

      // Registrar en bitácora
      await registrarBitacora(
        'Creación de Pago',
        `Pago de Inscripción registrado para Alumno ID: ${idAlumno}. Monto: Q${montoInscripcion.toFixed(2)}`
      );

      // Limpiar formulario para nuevo pago
      handleNuevoPago();

    } catch (error) {
      console.error('❌ Error al registrar pago:', error);
      const mensajeError = error.response?.data?.error || error.response?.data?.message || 'Error al registrar el pago. Intenta de nuevo.';
      message.error(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoPago = () => {
    form.resetFields();
    setSelectedAlumno(null);
    setAlumnoData([]);
    setMontoInscripcion(200);
    setFechaPago(dayjs());
    message.info('Listo para un nuevo pago de inscripción.');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 24 }}>
      <Title level={2}>
        <DollarOutlined style={{ marginRight: 12, color: '#52c41a' }} />
        Pago de Inscripción
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Registra un pago de inscripción para un alumno existente
      </Text>

      <Card>
        <Form form={form} name="crearPagoInscripcion" onFinish={onFinish} layout="vertical">
          {/* Fecha de Pago */}
          <Form.Item
            label="Fecha de Pago"
            required
            rules={[{ required: true, message: 'Selecciona la fecha' }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              value={fechaPago}
              onChange={(date) => setFechaPago(date)}
              style={{ width: '100%' }}
              placeholder="Selecciona fecha"
              allowClear={false}
            />
          </Form.Item>

          {/* Buscar Alumno */}
          <Form.Item label="Alumno">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Input.Group compact style={{ flex: 1 }}>
                <Form.Item name="Nombres" noStyle>
                  <Input readOnly style={{ flex: 2 }} placeholder="Nombre del Alumno" />
                </Form.Item>
                <Form.Item name="IdAlumno" noStyle>
                  <Input readOnly style={{ flex: 1 }} placeholder="Carnet" />
                </Form.Item>
              </Input.Group>
              <Button
                type="primary"
                onClick={() => setIsSearchModalOpen(true)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Buscar Alumno
              </Button>
            </div>
          </Form.Item>

          {/* Grado (solo lectura) */}
          <Form.Item name="Grado" label="Grado">
            <Input readOnly placeholder="Se mostrará al seleccionar alumno" />
          </Form.Item>

          {/* Monto de Inscripción */}
          <Form.Item label="Monto de Inscripción" required>
            <InputNumber
              value={montoInscripcion}
              onChange={(value) => setMontoInscripcion(value)}
              min={0}
              step={10}
              precision={2}
              style={{ width: '100%' }}
              formatter={(value) => `Q ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/Q\s?|(,*)/g, '')}
            />
          </Form.Item>

          {/* Método de Pago */}
          <Form.Item name="IdMetodoPago" label="Método de Pago">
            <Select placeholder="Selecciona un método" defaultValue={1}>
              {metodosPago.map((m) => (
                <Option key={m.IdMetodoPago} value={m.IdMetodoPago}>
                  {m.NombreMetodoPago}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Número de Recibo */}
          <Form.Item name="NumeroRecibo" label="Número de Recibo">
            <Input placeholder="Ej: INS-2026-001" />
          </Form.Item>

          {/* Nombre en Recibo */}
          <Form.Item name="NombreRecibo" label="Nombre en Recibo">
            <Input placeholder="Ej: Juan Pérez" />
          </Form.Item>

          {/* Dirección en Recibo */}
          <Form.Item name="DireccionRecibo" label="Dirección en Recibo">
            <Input placeholder="Ej: 10ma avenida 5-20, Zona 1" />
          </Form.Item>

          {/* Total a pagar */}
          <div style={{
            padding: '16px',
            background: '#f6ffed',
            borderRadius: 8,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            color: '#52c41a',
            margin: '16px 0',
            border: '1px solid #b7eb8f'
          }}>
            TOTAL A PAGAR: <span style={{ color: '#389e0d' }}>Q {montoInscripcion.toFixed(2)}</span>
          </div>

          {/* Botones */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!form.getFieldValue('IdAlumno')}
              style={{
                background: form.getFieldValue('IdAlumno') ? '#52c41a' : '#d9d9d9',
                borderColor: form.getFieldValue('IdAlumno') ? '#52c41a' : '#d9d9d9',
                width: '100%',
                height: 45,
                fontSize: 16
              }}
            >
              Registrar Pago de Inscripción
            </Button>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={handleNuevoPago} type="default">
                Nuevo Pago
              </Button>
              <Button
                type="default"
                danger
                onClick={() => navigate('/dashboard')}
                style={{
                  backgroundColor: '#d4380d',
                  borderColor: '#d4380d',
                  color: 'white',
                }}
              >
                Salir al Dashboard
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Modal de búsqueda de alumno */}
      <Modal
        title="Buscar Alumno"
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
        footer={[
          <Button key="search" type="primary" onClick={handleSearchAlumno} style={{ background: '#52c41a' }}>
            Buscar
          </Button>,
          <Button key="close" onClick={() => setIsSearchModalOpen(false)}>Cerrar</Button>,
        ]}
        width={1000}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Select
            showSearch
            placeholder="Selecciona un alumno"
            onChange={setSelectedAlumno}
            style={{ width: 300 }}
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {alumnos.map((a) => (
              <Option key={a.IdAlumno} value={a.IdAlumno}>
                {`${a.Nombres} ${a.Apellidos}`}
              </Option>
            ))}
          </Select>
          <Input
            placeholder="Ciclo Escolar"
            value={cicloEscolar}
            onChange={(e) => setCicloEscolar(e.target.value)}
            style={{ width: 200 }}
          />
        </div>

        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Haz doble clic en una fila para seleccionar el alumno
        </Text>

        <Table
          columns={[
            { title: 'Carnet', dataIndex: ['0', 'IdAlumno'], width: 120 },
            { title: 'Nombres', dataIndex: ['0', 'Nombres'], width: 150 },
            { title: 'Apellidos', dataIndex: ['0', 'Apellidos'], width: 150 },
            { title: 'Grado', dataIndex: ['0', 'NombreGrado'] },
          ]}
          dataSource={alumnoData}
          rowKey={(r) => r[0]?.IdAlumno}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
          })}
          pagination={false}
          scroll={{ y: 300 }}
        />
      </Modal>
    </div>
  );
};

export default CrearPagoInscripcion;

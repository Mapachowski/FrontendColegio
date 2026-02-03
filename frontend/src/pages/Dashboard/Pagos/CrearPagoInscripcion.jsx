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
  Space,
  Radio
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
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [tipoInscripcion, setTipoInscripcion] = useState('regular'); // 'regular' o 'mecanografia'
  const [esPrimeroBasico, setEsPrimeroBasico] = useState(false);
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
        message.error('Error al cargar datos: Revisa la conexión.');
      }
    };
    fetchData();
  }, []);

  // Cambiar monto cuando cambia el tipo de inscripción
  useEffect(() => {
    if (tipoInscripcion === 'mecanografia') {
      setMontoInscripcion(40);
    } else {
      setMontoInscripcion(200);
    }
  }, [tipoInscripcion]);

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
      message.error('Error al buscar alumno');
      setAlumnoData([]);
    }
  };

  const handleRowDoubleClick = async (record) => {
    const data = record[0];
    const idAlumno = data.IdAlumno;
    const grado = data.NombreGrado || '';
    const esPrimero = grado.toLowerCase().includes('primero básico');

    setEsPrimeroBasico(esPrimero);

    // Si el tipo de inscripción es mecanografía pero el alumno no es de Primero Básico, cambiar a regular
    if (tipoInscripcion === 'mecanografia' && !esPrimero) {
      setTipoInscripcion('regular');
      setMontoInscripcion(200);
      message.warning('Inscripción Mecanografía solo disponible para Primero Básico.');
    }

    // Guardar información completa del alumno
    setAlumnoSeleccionado({
      IdAlumno: idAlumno,
      NombreCompleto: `${data.Nombres} ${data.Apellidos}`,
      Grado: data.NombreGrado || '',
      Seccion: data.NombreSeccion || '',
      Jornada: data.NombreJornada || ''
    });

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
      // Determinar IdTipoPago y Concepto según el tipo de inscripción
      const idTipoPago = tipoInscripcion === 'mecanografia' ? 4 : 3;
      const concepto = tipoInscripcion === 'mecanografia' ? 'Inscripción Mecanografía' : 'Inscripción';

      const payload = {
        IdColaborador: user.IdUsuario,
        IdUsuario: user.IdUsuario,
        Fecha: fechaPago.format('YYYY-MM-DD'),
        IdAlumno: idAlumno,
        IdTipoPago: idTipoPago,
        Concepto: concepto,
        IdMetodoPago: values.IdMetodoPago || 1,
        Monto: montoInscripcion,
        NumeroRecibo: values.NumeroRecibo || null,
        Estado: true,
        NombreRecibo: values.NombreRecibo || null,
        DireccionRecibo: values.DireccionRecibo || null,
        Anio: getCicloActual(),
      };


      const response = await apiClient.post('/pagos', payload);

      const mensajeExito = tipoInscripcion === 'mecanografia'
        ? 'Pago de Inscripción Mecanografía registrado exitosamente.'
        : 'Pago de inscripción registrado exitosamente.';

      message.success(mensajeExito);

      // Registrar en bitácora
      const descripcionBitacora = tipoInscripcion === 'mecanografia'
        ? `Pago de Inscripción Mecanografía registrado para Alumno ID: ${idAlumno}. Monto: Q${montoInscripcion.toFixed(2)}`
        : `Pago de Inscripción registrado para Alumno ID: ${idAlumno}. Monto: Q${montoInscripcion.toFixed(2)}`;

      await registrarBitacora('Creación de Pago', descripcionBitacora);

      // Limpiar formulario para nuevo pago
      handleNuevoPago();

    } catch (error) {
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
    setAlumnoSeleccionado(null);
    setMontoInscripcion(200);
    setFechaPago(dayjs());
    setTipoInscripcion('regular');
    setEsPrimeroBasico(false);
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

          {/* Card de Alumno Seleccionado */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>Alumno</strong>
              <Button
                type="primary"
                onClick={() => setIsSearchModalOpen(true)}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Buscar Alumno
              </Button>
            </div>

            {alumnoSeleccionado ? (
              <Card
                size="small"
                style={{
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Carnet</Text>
                    <div style={{ fontWeight: 500 }}>{alumnoSeleccionado.IdAlumno}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Nombre Completo</Text>
                    <div style={{ fontWeight: 500 }}>{alumnoSeleccionado.NombreCompleto}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Grado</Text>
                    <div style={{ fontWeight: 500 }}>{alumnoSeleccionado.Grado}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Sección</Text>
                    <div style={{ fontWeight: 500 }}>{alumnoSeleccionado.Seccion}</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Jornada</Text>
                    <div style={{ fontWeight: 500 }}>{alumnoSeleccionado.Jornada}</div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card
                size="small"
                style={{
                  background: '#fff7e6',
                  border: '1px solid #ffd591',
                  textAlign: 'center'
                }}
              >
                <Text type="secondary">No se ha seleccionado un alumno</Text>
              </Card>
            )}
          </div>

          {/* Tipo de Inscripción */}
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <strong style={{ display: 'block', marginBottom: 12 }}>Tipo de Inscripción</strong>
            <Radio.Group
              value={tipoInscripcion}
              onChange={(e) => setTipoInscripcion(e.target.value)}
              buttonStyle="solid"
              size="large"
              disabled={!form.getFieldValue('IdAlumno')}
            >
              <Radio.Button value="regular">Inscripción Regular</Radio.Button>
              {esPrimeroBasico && (
                <Radio.Button value="mecanografia">Inscripción Mecanografía</Radio.Button>
              )}
            </Radio.Group>
            {!form.getFieldValue('IdAlumno') && (
              <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                Selecciona un alumno para ver opciones
              </div>
            )}
          </div>

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
              disabled={tipoInscripcion === 'mecanografia'}
            />
            {tipoInscripcion === 'mecanografia' && (
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                El monto para Inscripción Mecanografía es fijo: Q 40.00
              </Text>
            )}
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
            { title: 'Carnet', dataIndex: ['0', 'IdAlumno'], width: 100 },
            { title: 'Nombre Completo', width: 250, render: (_, record) => `${record[0]?.Nombres || ''} ${record[0]?.Apellidos || ''}` },
            { title: 'Grado', dataIndex: ['0', 'NombreGrado'], width: 180 },
            { title: 'Sección', dataIndex: ['0', 'NombreSeccion'], width: 100 },
            { title: 'Jornada', dataIndex: ['0', 'NombreJornada'], width: 120 },
          ]}
          dataSource={alumnoData}
          rowKey={(r) => r[0]?.IdAlumno}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
          })}
          pagination={false}
          scroll={{ y: 300, x: 800 }}
        />
      </Modal>
    </div>
  );
};

export default CrearPagoInscripcion;

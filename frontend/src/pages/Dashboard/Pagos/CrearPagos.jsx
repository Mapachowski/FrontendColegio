import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Modal, Table } from 'antd';
import apiClient from '../../../api/apiClient';
const { Option } = Select;

const CrearPago = () => {
  const [form] = Form.useForm();
  const [alumnos, setAlumnos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [tiposPago, setTiposPago] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [cicloEscolar, setCicloEscolar] = useState('2026');
  const [alumnoData, setAlumnoData] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null, rol: null };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alumnosResponse, metodosPagoResponse, tiposPagoResponse] = await Promise.all([
          apiClient.get('/alumnos'),
          apiClient.get('/metodopagos'),
          apiClient.get('/tipopagos'),
        ]);

        setAlumnos(alumnosResponse.data?.data || alumnosResponse.data || []);
        setMetodosPago(metodosPagoResponse.data?.data || metodosPagoResponse.data || []);
        setTiposPago(tiposPagoResponse.data?.data || tiposPagoResponse.data || []);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        message.error('Error al cargar datos: Revisa la conexión.');
      }
    };
    fetchData();
  }, []);

  const onFinish = (values) => {
    if (!user.IdUsuario) {
      message.error('No hay usuario logueado. Por favor, inicia sesión.');
      return;
    }

    const payload = {
      IdColaborador: user.IdUsuario,
      IdUsuario: user.IdUsuario,
      Fecha: values.Fecha.format('YYYY-MM-DD'),
      IdAlumno: values.IdAlumno,
      IdTipoPago: values.IdTipoPago,
      Concepto: values.Concepto,
      IdMetodoPago: values.IdMetodoPago,
      Monto: parseFloat(values.Monto),
      NumeroRecibo: values.NumeroRecibo || null,
      Estado: true,
      // CAMPOS NUEVOS
      NombreRecibo: values.NombreRecibo || null,
      DireccionRecibo: values.DireccionRecibo || null,
    };

    console.log('Payload enviado:', payload);
    apiClient.post('/pagos', payload)
      .then(() => {
        message.success('Pago creado con éxito');
        setIsSuccessModalOpen(true);
        form.resetFields();
      })
      .catch((error) => {
        console.error('Error al crear pago:', error.response?.data || error);
        message.error('Error al crear el pago');
      });
  };

  const handleSearchAlumno = async () => {
    if (!selectedAlumno) {
      message.warning('Por favor selecciona un alumno.');
      return;
    }

    try {
      const response = await apiClient.get(
        `/inscripciones/buscar-alumno?IdAlumno=${selectedAlumno}&CicloEscolar=${cicloEscolar}`
      );

      if (response.data.success && response.data.data?.length > 0) {
        const data = response.data.data[0];
        setAlumnoData(response.data.data);

        // CARGAR DATOS DE FAMILIA
        if (data.IdFamilia) {
          try {
            const familiaRes = await apiClient.get(`/familias/${data.IdFamilia}`);
            const familia = familiaRes.data;

            form.setFieldsValue({
              NombreRecibo: familia.NombreRecibo || '',
              DireccionRecibo: familia.DireccionRecibo || '',
            });
          } catch (err) {
            console.warn('Familia no encontrada o sin datos:', err);
            form.setFieldsValue({ NombreRecibo: '', DireccionRecibo: '' });
          }
        } else {
          form.setFieldsValue({ NombreRecibo: '', DireccionRecibo: '' });
        }
      } else {
        setAlumnoData([]);
        message.warning('No se encontraron datos para el alumno.');
      }
    } catch (error) {
      console.error('Error al buscar alumno:', error);
      message.error('Error al buscar alumno');
      setAlumnoData([]);
    }
  };

const handleRowDoubleClick = async (record) => {
  const data = record[0];

  console.log('DATOS DEL SP:', data);

  // Llenar datos básicos
  form.setFieldsValue({
    IdAlumno: data.IdAlumno,
    Nombres: `${data.Nombres} ${data.Apellidos}`,
    Monto: parseFloat(data.Mensualidad) || 0,
  });

  // CARGAR DATOS DE RECIBO DESDE FAMILIA
  if (data.IdFamilia) {
    try {
      const familiaRes = await apiClient.get(`/familias/${data.IdFamilia}`);
      const familia = familiaRes.data.data; // ← AQUÍ ESTABA EL ERROR

      console.log('DATOS DE FAMILIA (API):', familia);

      form.setFieldsValue({
        NombreRecibo: familia.NombreRecibo || familia.NombreFamilia || '',
        DireccionRecibo: familia.DireccionRecibo || familia.Direccion || '',
      });
    } catch (err) {
      console.error('Error al cargar familia:', err);
      // Fallback
      form.setFieldsValue({
        NombreRecibo: data.NombreFamilia || '',
        DireccionRecibo: data.Direccion || '',
      });
    }
  }

  setIsSearchModalOpen(false);
};

  const columns = [
    { title: 'Carnet', dataIndex: ['0', 'IdAlumno'], key: 'IdAlumno', width: 120 },
    { title: 'Matrícula', dataIndex: ['0', 'Matricula'], key: 'Matricula' },
    { title: 'Nombres', dataIndex: ['0', 'Nombres'], key: 'Nombres', width: 150 },
    { title: 'Apellidos', dataIndex: ['0', 'Apellidos'], key: 'Apellidos', width: 150 },
    { title: 'Grado', dataIndex: ['0', 'NombreGrado'], key: 'NombreGrado' },
    { title: 'Mensualidad', dataIndex: ['0', 'Mensualidad'], key: 'Mensualidad' },
    { title: 'Sección', dataIndex: ['0', 'NombreSeccion'], key: 'NombreSeccion' },
    { title: 'Jornada', dataIndex: ['0', 'NombreJornada'], key: 'NombreJornada', width: 100 },
    { title: 'Ciclo Escolar', dataIndex: ['0', 'CicloEscolar'], key: 'CicloEscolar' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: 24 }}>
      <h2>Ingresar Pago</h2>

      <Form form={form} name="createPago" onFinish={onFinish} layout="vertical" key={refreshTrigger}>
        <Form.Item name="Fecha" label="Fecha" rules={[{ required: true, message: 'Selecciona la fecha' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Alumno">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Input.Group compact style={{ display: 'flex', flex: 1 }}>
              <Form.Item name="Nombres" noStyle>
                <Input readOnly style={{ flex: 2, minWidth: '250px' }} placeholder="Nombre del Alumno" />
              </Form.Item>
              <Form.Item name="IdAlumno" noStyle>
                <Input readOnly style={{ flex: 1, minWidth: '150px' }} placeholder="Carnet" />
              </Form.Item>
            </Input.Group>
            <Button type="primary" onClick={() => setIsSearchModalOpen(true)} style={{ background: '#003366', borderColor: '#003366' }}>
              Buscar Alumno
            </Button>
          </div>
        </Form.Item>

        <Form.Item name="IdMetodoPago" label="Método de Pago" rules={[{ required: true }]}>
          <Select placeholder="Selecciona un método">
            {metodosPago.map((m) => (
              <Option key={m.IdMetodoPago} value={m.IdMetodoPago}>{m.NombreMetodoPago}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="IdTipoPago" label="Tipo de Pago" rules={[{ required: true }]}>
          <Select placeholder="Selecciona un tipo">
            {tiposPago.map((t) => (
              <Option key={t.IdTipoPago} value={t.IdTipoPago}>{t.NombreTipoPago}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="Concepto" label="Mes a Pagar" rules={[{ required: true, message: 'Selecciona el mes' }]}>
          <Select placeholder="Selecciona el mes">
            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre'].map((mes) => (
              <Option key={mes} value={mes}>{mes}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="Monto" label="Monto" rules={[{ required: true }]}>
          <Input type="number" step="0.01" />
        </Form.Item>

        <Form.Item name="NumeroRecibo" label="Número de Recibo">
          <Input />
        </Form.Item>

        {/* CAMPOS NUEVOS */}
        <Form.Item name="NombreRecibo" label="Nombre en Recibo">
          <Input placeholder="Ej: Juan Pérez" />
        </Form.Item>

        <Form.Item name="DireccionRecibo" label="Dirección en Recibo">
          <Input placeholder="Ej: 10ma avenida 5-20, Zona 1" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ background: '#003366', borderColor: '#003366' }}>
            Ingresar Pago
          </Button>
        </Form.Item>
      </Form>

      {/* MODAL DE BÚSQUEDA */}
      <Modal
        title="Buscar Alumno"
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
        footer={[
          <Button key="search" type="primary" onClick={handleSearchAlumno} style={{ background: '#003366', borderColor: '#003366' }}>
            Buscar
          </Button>,
          <Button key="close" onClick={() => setIsSearchModalOpen(false)}>
            Cerrar
          </Button>,
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

        <Table
          columns={columns}
          dataSource={alumnoData}
          rowKey={(r) => r[0]?.IdAlumno}
          onRow={(record) => ({
            onDoubleClick: () => handleRowDoubleClick(record),
          })}
          pagination={false}
          scroll={{ y: 300 }}
        />
      </Modal>

      {/* MODAL DE ÉXITO */}
      <Modal
        title="Éxito"
        open={isSuccessModalOpen}
        onOk={() => setIsSuccessModalOpen(false)}
        onCancel={() => setIsSuccessModalOpen(false)}
      >
        <p>Pago realizado con éxito</p>
      </Modal>
    </div>
  );
};

export default CrearPago;
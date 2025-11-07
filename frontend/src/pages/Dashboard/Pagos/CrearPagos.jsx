import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  message, 
  Modal, 
  Table, 
  Checkbox, 
  Tag, 
  Space, 
  Typography, 
  Radio 
} from 'antd';
import apiClient from '../../../api/apiClient';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const CrearPago = () => {
  const [form] = Form.useForm();
  const [alumnos, setAlumnos] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [cicloEscolar, setCicloEscolar] = useState('2026');
  const [alumnoData, setAlumnoData] = useState([]);
  const [tipoPago, setTipoPago] = useState('mensualidad');
  const [esPrimeroBasico, setEsPrimeroBasico] = useState(false);
  const [mesesPago, setMesesPago] = useState([]);
  const [selectedMeses, setSelectedMeses] = useState([]);
  const [loadingMeses, setLoadingMeses] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null, rol: null };

  const fechaHoy = dayjs();

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

  const getIdTipoPago = () => {
    return tipoPago === 'mensualidad' ? 2 : 4;
  };

  // CARGAR MESES DESDE SP + LOG DETALLADO
  const cargarMesesDesdeSP = async (idAlumno, idTipoPago, ciclo) => {
    if (!idAlumno || !idTipoPago || !ciclo) return;

    setLoadingMeses(true);
    try {

      const response = await apiClient.get(
        `/pagos/meses-pagados/${idAlumno}/${idTipoPago}/${ciclo}`
      );

      let rawData = response.data?.data;
      let dataArray = [];

      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        dataArray = Object.values(rawData);
      } else if (Array.isArray(rawData)) {
        dataArray = rawData;
      }

      if (!Array.isArray(dataArray)) {
        dataArray = [];
      }

      const montoFijo = idTipoPago === 2 ? 175.00 : 40.00;

      const mesesFormateados = dataArray.map((item, index) => {
        const monto = parseFloat(item.Monto) > 0 ? parseFloat(item.Monto) : montoFijo;

        return {
          MesNombre: item.MesNombre || 'Sin mes',
          Estado: item.Estado === 'Pagado' ? 'Pagado' : 'Pendiente',
          Monto: monto,
          FechaPagado: item.FechaPago 
            ? dayjs(item.FechaPago).format('DD/MM/YYYY')
            : null,
          index,
        };
      });

      setMesesPago(mesesFormateados);
      setSelectedMeses([]);


    } catch (error) {
      console.error('Error al cargar meses:', error);
      message.error('Error al cargar los meses.');
      setMesesPago([]);
    } finally {
      setLoadingMeses(false);
    }
  };

  // VALIDACIÓN SECUENCIAL + DESELECCIÓN EN CASCADA
  const handleCheckboxChange = (record) => {
    if (record.Estado === 'Pagado') return;

    const index = record.index;
    const meses = [...mesesPago];

    // Si se está seleccionando
    if (!selectedMeses.some(m => m.MesNombre === record.MesNombre)) {
      // Validar meses anteriores
      for (let i = 0; i < index; i++) {
        const mesAnterior = meses[i];
        if (mesAnterior.Estado !== 'Pagado' && !selectedMeses.some(s => s.MesNombre === mesAnterior.MesNombre)) {
          message.warning(`Debes pagar ${mesAnterior.MesNombre} antes de ${record.MesNombre}`);
          return;
        }
      }
      setSelectedMeses(prev => [...prev, record]);
    } 
    // Si se está deseleccionando → quitar todos los siguientes
    else {
      const mesesADesmarcar = meses
        .slice(index)
        .filter(m => selectedMeses.some(s => s.MesNombre === m.MesNombre));

      setSelectedMeses(prev =>
        prev.filter(m => !mesesADesmarcar.some(d => d.MesNombre === m.MesNombre))
      );

      message.info(`Se deseleccionaron ${mesesADesmarcar.length} mes(es) posteriores a ${record.MesNombre}`);
    }
  };

  const onFinish = async (values) => {
    const idAlumno = form.getFieldValue('IdAlumno');
    if (!idAlumno) {
      message.warning('Por favor selecciona un alumno.');
      return;
    }

    if (selectedMeses.length === 0) {
      message.warning('Selecciona al menos un mes pendiente.');
      return;
    }

    const idTipoPago = getIdTipoPago();
    const montoFijo = idTipoPago === 2 ? 175.00 : 40.00;

    const pagos = selectedMeses.map(mes => ({
      IdColaborador: user.IdUsuario,
      IdUsuario: user.IdUsuario,
      Fecha: fechaHoy.format('YYYY-MM-DD'),
      IdAlumno: idAlumno,
      IdTipoPago: idTipoPago,
      Concepto: idTipoPago === 2 ? mes.MesNombre : 'Mecanoografía',
      IdMetodoPago: values.IdMetodoPago,
      Monto: mes.Monto || montoFijo,
      NumeroRecibo: values.NumeroRecibo || null,
      Estado: true,
      NombreRecibo: values.NombreRecibo || null,
      DireccionRecibo: values.DireccionRecibo || null,
    }));

    try {
      setLoadingMeses(true);

      const responses = await Promise.all(
        pagos.map(payload => apiClient.post('/pagos', payload))
      );


      message.success(`Se registraron ${responses.length} pagos exitosamente.`);
      setIsSuccessModalOpen(true);

      // RECARGAR MESES PARA VER ACTUALIZACIÓN
      await cargarMesesDesdeSP(idAlumno, idTipoPago, cicloEscolar);

    } catch (error) {
      console.error('Error al registrar pagos:', error);
      message.error('Error al registrar los pagos. Intenta de nuevo.');
    } finally {
      setLoadingMeses(false);
    }
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
    const grado = data.NombreGrado || '';
    const esPrimero = grado.toLowerCase().includes('primero básico');

    setEsPrimeroBasico(esPrimero);

    if (tipoPago === 'mecanografia' && !esPrimero) {
      setTipoPago('mensualidad');
      message.warning('Mecanoografía solo disponible para Primero Básico.');
    }

    form.setFieldsValue({
      IdAlumno: idAlumno,
      Nombres: `${data.Nombres} ${data.Apellidos}`,
    });

    if (data.IdFamilia) {
      try {
        const familiaRes = await apiClient.get(`/familias/${data.IdFamilia}`);
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

    const idTipoPago = getIdTipoPago();
    await cargarMesesDesdeSP(idAlumno, idTipoPago, cicloEscolar);

    setIsSearchModalOpen(false);
  };

  useEffect(() => {
    const idAlumno = form.getFieldValue('IdAlumno');
    if (idAlumno && cicloEscolar) {
      const idTipoPago = getIdTipoPago();
      cargarMesesDesdeSP(idAlumno, idTipoPago, cicloEscolar);
    }
  }, [tipoPago, form, cicloEscolar]);

  const columnsMeses = [
    { title: 'Mes', dataIndex: 'MesNombre', key: 'MesNombre' },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'Estado',
      render: (estado) => (
        <Tag color={estado === 'Pagado' ? 'green' : 'orange'}>
          {estado}
        </Tag>
      ),
    },
    { title: 'Monto', dataIndex: 'Monto', key: 'Monto', render: (m) => `Q${m.toFixed(2)}` },
    { title: 'Fecha Pagado', dataIndex: 'FechaPagado', key: 'FechaPagado', render: (f) => f || '-' },
    {
      title: 'Pagar',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={selectedMeses.some(m => m.MesNombre === record.MesNombre)}
          disabled={record.Estado === 'Pagado'}
          onChange={() => handleCheckboxChange(record)}
        />
      ),
    },
  ];

  const montoTotal = selectedMeses.reduce((sum, m) => sum + m.Monto, 0);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 24 }}>
      <h2>Ingresar Pago</h2>

      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Radio.Group
          value={tipoPago}
          onChange={(e) => setTipoPago(e.target.value)}
          buttonStyle="solid"
          size="large"
          disabled={!form.getFieldValue('IdAlumno')}
        >
          <Radio.Button value="mensualidad">Mensualidad</Radio.Button>
          {esPrimeroBasico && (
            <Radio.Button value="mecanografia">Mecanoografía</Radio.Button>
          )}
        </Radio.Group>
        {!form.getFieldValue('IdAlumno') && (
          <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
            Selecciona un alumno para ver opciones
          </div>
        )}
      </div>

      <Form form={form} name="createPago" onFinish={onFinish} layout="vertical">
        <Form.Item label="Fecha" required>
          <Input value={fechaHoy.format('DD/MM/YYYY')} disabled style={{ fontWeight: 'bold' }} />
        </Form.Item>

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
              style={{ background: '#003366', borderColor: '#003366' }}
            >
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

        {loadingMeses ? (
          <Text>Cargando meses...</Text>
        ) : mesesPago.length > 0 ? (
          <>
            <Text strong style={{ fontSize: 16, display: 'block', margin: '16px 0 8px' }}>
              Selecciona los meses a pagar:
            </Text>
            <Table
              columns={columnsMeses}
              dataSource={mesesPago}
              rowKey="MesNombre"
              pagination={false}
              bordered
              size="small"
            />
            <Space style={{ margin: '16px 0' }}>
              <Text strong>Total a pagar:</Text>
              <Text type="danger" style={{ fontSize: 18 }}>
                Q{montoTotal.toFixed(2)}
              </Text>
            </Space>
          </>
        ) : form.getFieldValue('IdAlumno') ? (
          <Text type="secondary">No hay meses disponibles.</Text>
        ) : null}

        <Form.Item name="NumeroRecibo" label="Número de Recibo">
          <Input />
        </Form.Item>

        <Form.Item name="NombreRecibo" label="Nombre en Recibo">
          <Input placeholder="Ej: Juan Pérez" />
        </Form.Item>

        <Form.Item name="DireccionRecibo" label="Dirección en Recibo">
          <Input placeholder="Ej: 10ma avenida 5-20, Zona 1" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{
              background: selectedMeses.length === 0 ? '#d9d9d9' : '#003366',
              borderColor: selectedMeses.length === 0 ? '#d9d9d9' : '#003366',
              color: selectedMeses.length === 0 ? '#000000' : '#fff',
            }}
            disabled={selectedMeses.length === 0}
          >
            Pagar Meses Seleccionados ({selectedMeses.length})
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="Buscar Alumno"
        open={isSearchModalOpen}
        onCancel={() => setIsSearchModalOpen(false)}
        footer={[
          <Button key="search" type="primary" onClick={handleSearchAlumno} style={{ background: '#003366' }}>
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

      <Modal
        title="Simulación Exitosa"
        open={isSuccessModalOpen}
        onOk={() => setIsSuccessModalOpen(false)}
        onCancel={() => setIsSuccessModalOpen(false)}
      >
        <p>Se simularon {selectedMeses.length} pagos. Revisa la consola.</p>
      </Modal>
    </div>
  );
};

export default CrearPago;
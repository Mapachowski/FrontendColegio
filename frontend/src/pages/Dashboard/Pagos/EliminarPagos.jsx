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
  Radio,
  Card,
  Popconfirm
} from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { sanitizeHTML } from '../../../utils/sanitize';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarBitacora } from '../../../utils/bitacora';

const { Option } = Select;
const { Text } = Typography;

const EliminarPagos = () => {
  const [form] = Form.useForm();
  const [alumnos, setAlumnos] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [cicloEscolar, setCicloEscolar] = useState('2026');
  const [alumnoData, setAlumnoData] = useState([]);
  const [tipoPago, setTipoPago] = useState('mensualidad');
  const [esPrimeroBasico, setEsPrimeroBasico] = useState(false);
  const [pagosPagados, setPagosPagados] = useState([]);
  const [selectedPagos, setSelectedPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null, rol: null };
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const alumnosResponse = await apiClient.get('/alumnos');
        setAlumnos(alumnosResponse.data?.data || alumnosResponse.data || []);
      } catch (error) {
        message.error('Error al cargar alumnos: Revisa la conexión.');
      }
    };
    fetchData();
  }, []);

  const getIdTipoPago = () => {
    return tipoPago === 'mensualidad' ? 2 : 3;
  };

  // CARGAR PAGOS REALIZADOS
  const cargarPagosPagados = async (idAlumno, idTipoPago, ciclo) => {
    if (!idAlumno || !idTipoPago || !ciclo) return;

    setLoadingPagos(true);
    try {
      const response = await apiClient.get(
        `/pagos/meses-pagados/${encodeURIComponent(idAlumno)}/${encodeURIComponent(idTipoPago)}/${encodeURIComponent(ciclo)}`
      );

      let rawData = response.data?.data;
      let dataArray = [];

      // LOG 1: Ver la respuesta completa del servidor
      console.log('=== RESPUESTA COMPLETA DEL SERVIDOR ===');
      console.log('response.data:', response.data);
      console.log('rawData:', rawData);

      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        dataArray = Object.values(rawData);
      } else if (Array.isArray(rawData)) {
        dataArray = rawData;
      }

      if (!Array.isArray(dataArray)) {
        dataArray = [];
      }

      // LOG 2: Ver el array de datos después del parseo
      console.log('=== ARRAY DE DATOS PARSEADO ===');
      console.log('dataArray:', dataArray);
      console.log('Cantidad de elementos:', dataArray.length);

      // LOG 3: Ver cada elemento individual
      dataArray.forEach((item, idx) => {
        console.log(`--- Item ${idx} ---`);
        console.log('Estado:', item.Estado);
        console.log('IdPago:', item.IdPago);
        console.log('MesNombre:', item.MesNombre);
        console.log('Objeto completo:', item);
      });

      // Filtrar solo los pagos que están en estado "Pagado"
      const pagosPagadosFormateados = dataArray
        .filter(item => item.Estado === 'Pagado')
        .map((item, index) => ({
          IdPago: item.IdPago !== undefined && item.IdPago !== null ? item.IdPago : null,
          MesNombre: item.MesNombre || 'Sin mes',
          Estado: 'Pagado',
          Monto: parseFloat(item.Monto) || 0,
          FechaPagado: item.FechaPago
            ? dayjs(item.FechaPago).format('DD/MM/YYYY')
            : null,
          NumeroRecibo: item.NumeroRecibo || '-',
          NombreRecibo: item.NombreRecibo || '-',
          index,
        }));

      // LOG 4: Ver los datos formateados que se van a mostrar
      console.log('=== PAGOS PAGADOS FORMATEADOS ===');
      console.log('pagosPagadosFormateados:', pagosPagadosFormateados);
      console.log('Cantidad de pagos pagados:', pagosPagadosFormateados.length);

      setPagosPagados(pagosPagadosFormateados);
      setSelectedPagos([]);

      if (pagosPagadosFormateados.length === 0) {
        message.info('Este alumno no tiene pagos registrados para eliminar.');
      }

    } catch (error) {
      message.error('Error al cargar los pagos.');
      setPagosPagados([]);
    } finally {
      setLoadingPagos(false);
    }
  };

  const handleCheckboxChange = (record) => {
    console.log('=== CHECKBOX CLICKED ===');
    console.log('Record completo:', record);
    console.log('record.IdPago:', record.IdPago);
    console.log('Tipo de IdPago:', typeof record.IdPago);

    const isSelected = selectedPagos.some(p => p.IdPago === record.IdPago);
    console.log('¿Está seleccionado?:', isSelected);

    if (isSelected) {
      console.log('Deseleccionando pago...');
      setSelectedPagos(prev => prev.filter(p => p.IdPago !== record.IdPago));
    } else {
      console.log('Seleccionando pago...');
      setSelectedPagos(prev => [...prev, record]);
    }
  };

  const onFinish = async () => {
    const idAlumno = form.getFieldValue('IdAlumno');
    if (!idAlumno) {
      message.warning('Por favor selecciona un alumno.');
      return;
    }

    if (selectedPagos.length === 0) {
      message.warning('Selecciona al menos un pago para eliminar.');
      return;
    }

    // Verificar que todos los pagos tengan IdPago
    const pagosSinId = selectedPagos.filter(p => !p.IdPago);
    if (pagosSinId.length > 0) {
      message.error('Algunos pagos no tienen ID. No se pueden eliminar.');
      return;
    }

    try {
      setLoadingPagos(true);

      console.log('=== ELIMINANDO PAGOS ===');
      console.log('Usuario IdColaborador:', user.IdUsuario);
      console.log('Pagos a eliminar:', selectedPagos);

      // Eliminar cada pago seleccionado enviando IdColaborador para bitácora
      const responses = await Promise.all(
        selectedPagos.map(pago => {
          console.log(`Eliminando pago IdPago: ${pago.IdPago}`);
          return apiClient.delete(`/pagos/${pago.IdPago}`, {
            data: {
              IdColaborador: user.IdUsuario
            }
          });
        })
      );

      console.log('Respuestas de eliminación:', responses);
      message.success(`Se eliminaron ${responses.length} pago(s) exitosamente.`);

      // Registrar en bitácora
      await registrarBitacora(
        'Eliminación de Pago',
        `${responses.length} pago(s) eliminado(s) para Alumno ID: ${idAlumno}`
      );

      // RECARGAR PAGOS PARA VER ACTUALIZACIÓN
      const idTipoPago = getIdTipoPago();
      await cargarPagosPagados(idAlumno, idTipoPago, cicloEscolar);

    } catch (error) {
      console.error('Error al eliminar pagos:', error);
      const mensajeError = error.response?.data?.error || error.response?.data?.message || 'Error al eliminar los pagos. Intenta de nuevo.';
      message.error(mensajeError);
    } finally {
      setLoadingPagos(false);
    }
  };

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

    if (tipoPago === 'mecanografia' && !esPrimero) {
      setTipoPago('mensualidad');
      message.warning('Mecanografía solo disponible para Primero Básico.');
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
    });

    const idTipoPago = getIdTipoPago();
    await cargarPagosPagados(idAlumno, idTipoPago, cicloEscolar);

    setIsSearchModalOpen(false);
  };

  useEffect(() => {
    const idAlumno = form.getFieldValue('IdAlumno');
    if (idAlumno && cicloEscolar) {
      const idTipoPago = getIdTipoPago();
      cargarPagosPagados(idAlumno, idTipoPago, cicloEscolar);
    }
  }, [tipoPago, form, cicloEscolar]);

  const columnsPagos = [
    { title: 'Mes', dataIndex: 'MesNombre', key: 'MesNombre' },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'Estado',
      render: () => (
        <Tag color="green">Pagado</Tag>
      ),
    },
    { title: 'Monto', dataIndex: 'Monto', key: 'Monto', render: (m) => `Q${m.toFixed(2)}` },
    { title: 'Fecha Pagado', dataIndex: 'FechaPagado', key: 'FechaPagado', render: (f) => f || '-' },
    {
      title: 'Número Recibo',
      dataIndex: 'NumeroRecibo',
      key: 'NumeroRecibo',
      render: (text) => text === '-' ? '-' : <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Nombre en Recibo',
      dataIndex: 'NombreRecibo',
      key: 'NombreRecibo',
      render: (text) => text === '-' ? '-' : text,
    },
    {
      title: 'Eliminar',
      width: 100,
      align: 'center',
      render: (_, record) => {
        // LOG: Ver el record en cada render de checkbox
        const isDisabled = record.IdPago === null || record.IdPago === undefined;
        console.log(`Checkbox para ${record.MesNombre}:`, {
          IdPago: record.IdPago,
          TipoIdPago: typeof record.IdPago,
          Disabled: isDisabled
        });

        return (
          <Checkbox
            checked={selectedPagos.some(p => p.IdPago === record.IdPago)}
            onChange={() => handleCheckboxChange(record)}
            disabled={isDisabled}
          />
        );
      },
    },
  ];

  const montoTotal = selectedPagos.reduce((sum, p) => sum + p.Monto, 0);

  const handleNuevoRegistro = () => {
    form.resetFields();
    setSelectedAlumno(null);
    setAlumnoData([]);
    setAlumnoSeleccionado(null);
    setSelectedPagos([]);
    setPagosPagados([]);
    setEsPrimeroBasico(false);
    setTipoPago('mensualidad');
    setCicloEscolar('2026');
    setIsSearchModalOpen(false);
    message.success('Listo para buscar otro alumno.');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <DeleteOutlined style={{ fontSize: 24, color: '#ff4d4f', marginRight: 12 }} />
        <h2 style={{ margin: 0 }}>Eliminar Pagos</h2>
      </div>

      <Card
        size="small"
        style={{
          background: '#fff1f0',
          border: '1px solid #ffccc7',
          marginBottom: 24
        }}
      >
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
          <Text type="danger">
            Esta acción eliminará los pagos seleccionados. Asegúrate de seleccionar correctamente.
          </Text>
        </Space>
      </Card>

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
            <Radio.Button value="mecanografia">Mecanografía</Radio.Button>
          )}
        </Radio.Group>
        {!form.getFieldValue('IdAlumno') && (
          <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
            Selecciona un alumno para ver opciones
          </div>
        )}
      </div>

      <Form form={form} name="eliminarPago" onFinish={onFinish} layout="vertical">
        {/* Card de Alumno Seleccionado */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Alumno</strong>
            <Button
              type="primary"
              onClick={() => setIsSearchModalOpen(true)}
              style={{ background: '#003366', borderColor: '#003366' }}
            >
              Buscar Alumno
            </Button>
          </div>

          {alumnoSeleccionado ? (
            <Card
              size="small"
              style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff'
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

        {loadingPagos ? (
          <Text>Cargando pagos...</Text>
        ) : pagosPagados.length > 0 ? (
          <>
            <Text strong style={{ fontSize: 16, display: 'block', margin: '16px 0 8px' }}>
              Selecciona los pagos a eliminar:
            </Text>
            <Table
              columns={columnsPagos}
              dataSource={pagosPagados}
              rowKey={(record) => record.IdPago || record.MesNombre}
              pagination={false}
              bordered
              size="small"
            />
            <Space style={{ margin: '16px 0' }}>
              <Text strong>Total a eliminar:</Text>
              <Text type="danger" style={{ fontSize: 18 }}>
                Q{montoTotal.toFixed(2)}
              </Text>
              <Text type="secondary">({selectedPagos.length} pago{selectedPagos.length !== 1 ? 's' : ''})</Text>
            </Space>
          </>
        ) : form.getFieldValue('IdAlumno') ? (
          <Card style={{ textAlign: 'center', padding: '40px 0' }}>
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Text type="secondary" style={{ display: 'block' }}>
              No hay pagos registrados para este alumno en el tipo de pago seleccionado.
            </Text>
          </Card>
        ) : null}

        <Form.Item>
          <Popconfirm
            title="¿Estás seguro de eliminar los pagos seleccionados?"
            description="Esta acción no se puede deshacer fácilmente."
            onConfirm={onFinish}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              style={{
                background: selectedPagos.length === 0 ? '#d9d9d9' : '#ff4d4f',
                borderColor: selectedPagos.length === 0 ? '#d9d9d9' : '#ff4d4f',
              }}
              disabled={selectedPagos.length === 0}
            >
              Eliminar Pagos Seleccionados ({selectedPagos.length})
            </Button>
          </Popconfirm>
        </Form.Item>

       <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            onClick={handleNuevoRegistro}
            type="default"
          >
            Nuevo Registro
          </Button>

          <Button
            type="default"
            danger
            size="large"
            onClick={() => {
              navigate('/dashboard');
            }}
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

export default EliminarPagos;

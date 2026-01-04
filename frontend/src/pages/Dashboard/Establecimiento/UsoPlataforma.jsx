import React, { useState, useEffect } from 'react';
import { Card, Table, Select, DatePicker, Button, message, Space, Typography, Tag } from 'antd';
import { SearchOutlined, ClearOutlined, DownloadOutlined, HistoryOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/es';
import apiClient from '../../../api/apiClient';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

moment.locale('es');

const UsoPlataforma = () => {
  const [bitacoras, setBitacoras] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // Filtros
  const [accionFiltro, setAccionFiltro] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [rangoFechas, setRangoFechas] = useState([]);

  // Acciones fijas del sistema
  const acciones = [
    'Inicio de sesión',
    'Descarga de reporte Excel',
    'Reset de contraseña'
  ];

  useEffect(() => {
    cargarUsuarios();
    cargarBitacoras();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await apiClient.get('/usuarios');
      const usuariosData = response.data?.data || response.data || [];
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      message.error('Error al cargar la lista de usuarios');
    }
  };

  const cargarBitacoras = async () => {
    try {
      setLoading(true);

      // Construir URL con parámetros de filtro
      let url = '/bitacoras/filtrar?';
      const params = [];

      if (accionFiltro) {
        params.push(`accion=${encodeURIComponent(accionFiltro)}`);
      }

      if (usuarioFiltro) {
        params.push(`idUsuario=${usuarioFiltro}`);
      }

      if (rangoFechas && rangoFechas.length === 2) {
        const fechaInicio = rangoFechas[0].format('YYYY-MM-DD');
        const fechaFin = rangoFechas[1].format('YYYY-MM-DD');
        params.push(`fechaInicio=${fechaInicio}`);
        params.push(`fechaFin=${fechaFin}`);
      }

      url += params.join('&');

      const response = await apiClient.get(url);
      const data = response.data?.data || response.data || [];
      const total = response.data?.total || data.length;

      setBitacoras(Array.isArray(data) ? data : []);
      setTotalRegistros(total);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar bitácoras:', error);
      message.error('Error al cargar las bitácoras');
      setBitacoras([]);
      setLoading(false);
    }
  };

  const handleBuscar = () => {
    cargarBitacoras();
  };

  const handleLimpiar = () => {
    setAccionFiltro('');
    setUsuarioFiltro('');
    setRangoFechas([]);
    setTimeout(() => {
      cargarBitacoras();
    }, 100);
  };

  const exportarExcel = () => {
    if (bitacoras.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    // Preparar datos para Excel
    const datosExcel = bitacoras.map((bitacora) => ({
      'ID': bitacora.IdBitacora,
      'Acción': bitacora.Accion,
      'Fecha': moment(bitacora.FechaBitacora).format('DD/MM/YYYY HH:mm:ss'),
      'Usuario': bitacora.Usuario?.NombreUsuario || '-',
      'Nombre Completo': bitacora.Usuario?.NombreCompleto || '-',
      'Observaciones': bitacora.Observacion || '-',
      'Ordenador': bitacora.Ordenador || '-'
    }));

    // Crear libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bitácoras');

    // Descargar archivo
    const fecha = moment().format('YYYY-MM-DD_HH-mm-ss');
    XLSX.writeFile(workbook, `Bitacoras_${fecha}.xlsx`);

    message.success('Reporte descargado exitosamente');
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'IdBitacora',
      key: 'IdBitacora',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.IdBitacora - b.IdBitacora
    },
    {
      title: 'Acción',
      dataIndex: 'Accion',
      key: 'Accion',
      width: '20%',
      render: (accion) => {
        let color = 'default';
        if (accion.includes('Inicio de sesión')) color = 'blue';
        else if (accion.includes('Descarga')) color = 'green';
        else if (accion.includes('Reset')) color = 'orange';

        return <Tag color={color}>{accion}</Tag>;
      },
      filters: acciones.map(a => ({ text: a, value: a })),
      onFilter: (value, record) => record.Accion.includes(value)
    },
    {
      title: 'Fecha y Hora',
      dataIndex: 'FechaBitacora',
      key: 'FechaBitacora',
      width: '15%',
      render: (fecha) => (
        <div>
          <div>{moment(fecha).format('DD/MM/YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(fecha).format('HH:mm:ss')}
          </Text>
        </div>
      ),
      sorter: (a, b) => moment(a.FechaBitacora).unix() - moment(b.FechaBitacora).unix(),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Usuario',
      key: 'usuario',
      width: '20%',
      render: (_, record) => (
        <div>
          <div><Text strong>{record.Usuario?.NombreUsuario || '-'}</Text></div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.Usuario?.NombreCompleto || '-'}
          </Text>
        </div>
      )
    },
    {
      title: 'Observaciones',
      dataIndex: 'Observacion',
      key: 'Observacion',
      ellipsis: true,
      render: (observacion) => observacion || '-'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <HistoryOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          Uso de Plataforma - Bitácoras del Sistema
        </Title>
        <Text type="secondary">
          Consulta y monitorea todas las acciones registradas en el sistema
        </Text>
      </div>

      {/* Filtros */}
      <Card
        style={{
          marginBottom: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Space wrap style={{ width: '100%' }}>
          {/* Filtro por Acción */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Acción
            </Text>
            <Select
              placeholder="Todas las acciones"
              style={{ width: 220 }}
              value={accionFiltro || undefined}
              onChange={(value) => setAccionFiltro(value)}
              allowClear
            >
              {acciones.map((accion) => (
                <Option key={accion} value={accion}>
                  {accion}
                </Option>
              ))}
            </Select>
          </div>

          {/* Filtro por Usuario */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Usuario
            </Text>
            <Select
              showSearch
              placeholder="Todos los usuarios"
              style={{ width: 220 }}
              value={usuarioFiltro || undefined}
              onChange={(value) => setUsuarioFiltro(value)}
              allowClear
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {usuarios.map((usuario) => (
                <Option key={usuario.IdUsuario} value={usuario.IdUsuario}>
                  {usuario.NombreUsuario} - {usuario.NombreCompleto}
                </Option>
              ))}
            </Select>
          </div>

          {/* Filtro por Rango de Fechas */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              Rango de Fechas
            </Text>
            <RangePicker
              style={{ width: 280 }}
              value={rangoFechas}
              onChange={(dates) => setRangoFechas(dates)}
              format="DD/MM/YYYY"
              placeholder={['Fecha Inicio', 'Fecha Fin']}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ marginTop: '28px' }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleBuscar}
                loading={loading}
              >
                Buscar
              </Button>
              <Button icon={<ClearOutlined />} onClick={handleLimpiar}>
                Limpiar
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Tabla de resultados */}
      <Card
        title={
          <Space>
            <Text strong>Registros encontrados: {totalRegistros}</Text>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportarExcel}
            disabled={bitacoras.length === 0}
          >
            Exportar a Excel
          </Button>
        }
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Table
          columns={columns}
          dataSource={bitacoras}
          rowKey="IdBitacora"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} registros`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default UsoPlataforma;

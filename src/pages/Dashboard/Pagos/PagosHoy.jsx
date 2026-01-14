import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, message, Typography, Button, Input } from 'antd';
import { DownloadOutlined, ReloadOutlined, CalendarOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarDescargaExcel } from '../../../utils/bitacora';

const { Title } = Typography;

const PagosHoy = () => {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cicloEscolar, setCicloEscolar] = useState(getCicloActual().toString());

  useEffect(() => {
    if (cicloEscolar && cicloEscolar.length === 4) {
      cargarPagosHoy();
    }
  }, []);

  const cargarPagosHoy = async () => {
    if (!cicloEscolar || cicloEscolar.length !== 4) {
      message.warning('Por favor ingresa un ciclo escolar válido (4 dígitos)');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.get(`/pagos/hoy?cicloEscolar=${cicloEscolar}`);

      if (res.data.success && res.data.data) {
        // El primer elemento del array contiene los datos reales con índices numéricos
        // El segundo elemento contiene metadatos de MySQL que debemos ignorar
        const datosReales = res.data.data[0];
        const pagosLimpios = Object.values(datosReales);

        setPagos(pagosLimpios);
        message.success(`${pagosLimpios.length} pago${pagosLimpios.length !== 1 ? 's' : ''} encontrado${pagosLimpios.length !== 1 ? 's' : ''} hoy`);
      } else {
        setPagos([]);
        message.info('No hay pagos registrados hoy');
      }
    } catch (err) {
      console.error('Error al cargar pagos de hoy:', err);
      message.error('Error al cargar pagos de hoy');
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  const columnas = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Carnet', dataIndex: 'Carnet', width: 120 },
    { title: 'Código MINEDUC', dataIndex: 'CodigoMineduc', width: 150 },
    { title: 'Nombre Completo', dataIndex: 'NombreCompleto', width: 250 },
    { title: 'Tipo Pago', dataIndex: 'NombreTipoPago', width: 150 },
    { title: 'Método Pago', dataIndex: 'NombreMetodoPago', width: 120 },
    { title: 'Concepto', dataIndex: 'Concepto', width: 200 },
    {
      title: 'Monto',
      dataIndex: 'Monto',
      width: 120,
      align: 'right',
      render: (monto) => `Q ${parseFloat(monto || 0).toFixed(2)}`
    },
    { title: 'Número Recibo', dataIndex: 'NumeroRecibo', width: 150 },
    { title: 'Nombre Recibo', dataIndex: 'NombreRecibo', width: 200 },
    { title: 'Dirección Recibo', dataIndex: 'DireccionRecibo', width: 250 },
    {
      title: 'Hora',
      dataIndex: 'Fecha',
      width: 120,
      render: (fecha) => fecha ? dayjs(fecha).format('HH:mm') : '-'
    },
  ];

  const exportarExcel = async () => {
    if (pagos.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Informe Diario de Ingresos');

    const filas = pagos.map((p, i) => ({
      '#': i + 1,
      'Carnet': p.Carnet,
      'Código MINEDUC': p.CodigoMineduc,
      'Nombre Completo': p.NombreCompleto,
      'Tipo Pago': p.NombreTipoPago,
      'Método Pago': p.NombreMetodoPago,
      'Concepto': p.Concepto,
      'Monto': parseFloat(p.Monto || 0).toFixed(2),
      'Número Recibo': p.NumeroRecibo,
      'Nombre Recibo': p.NombreRecibo,
      'Dirección Recibo': p.DireccionRecibo,
      'Hora': p.Fecha ? dayjs(p.Fecha).format('HH:mm') : '-'
    }));

    // Calcular total
    const total = pagos.reduce((sum, p) => sum + parseFloat(p.Monto || 0), 0);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A10' });

    const wscols = [
      { wch: 6 }, { wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 18 },
      { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 35 }, { wch: 10 }
    ];
    ws['!cols'] = wscols;

    XLSX.utils.sheet_add_aoa(ws, [['PAGOS DEL DÍA']], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    const hoy = dayjs().format('DD/MM/YYYY');
    XLSX.utils.sheet_add_aoa(ws, [[`Fecha: ${hoy} | Ciclo Escolar: ${cicloEscolar}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 12, italic: true }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Generado a las: ${dayjs().format('HH:mm')}`]], { origin: 'A4' });
    ws['A4'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Total de pagos: ${pagos.length} | Monto Total: Q ${total.toFixed(2)}`]], { origin: 'A6' });
    ws['A6'].s = { font: { name: 'Arial', sz: 11, bold: true }, alignment: { horizontal: 'center' } };

    XLSX.utils.book_append_sheet(wb, ws, 'Pagos Hoy');
    const filename = `Pagos_Hoy_${hoy.replace(/\//g, '-')}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), filename);
    message.success('Excel generado correctamente');
  };

  // Calcular total de montos
  const totalMonto = pagos.reduce((sum, pago) => sum + parseFloat(pago.Monto || 0), 0);
  const fechaHoy = dayjs().format('dddd, D [de] MMMM [de] YYYY');

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <CalendarOutlined /> Pagos de Hoy
      </Title>
      <Title level={5} type="secondary">{fechaHoy}</Title>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <strong>Ciclo Escolar *</strong>
            <Input
              value={cicloEscolar}
              maxLength={4}
              placeholder="Ej: 2026"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCicloEscolar(val);
              }}
            />
          </div>

          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={cargarPagosHoy}
            loading={loading}
            size="large"
          >
            Cargar Pagos de Hoy
          </Button>
        </div>
      </Card>

      {pagos.length > 0 && (
        <Card
          title={
            <div>
              <strong>{pagos.length} pago{pagos.length !== 1 ? 's' : ''} registrado{pagos.length !== 1 ? 's' : ''} hoy</strong>
              <div style={{ fontSize: '16px', color: '#52c41a', marginTop: 8 }}>
                Total del día: Q {totalMonto.toFixed(2)}
              </div>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportarExcel}
            >
              Exportar Excel
            </Button>
          }
        >
          <Table
            columns={columnas}
            dataSource={pagos}
            rowKey={(record, index) => `${record.NumeroRecibo}-${index}`}
            loading={loading}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: ['25', '50', '100', '200'],
              showTotal: (total) => `Total: ${total} pagos`
            }}
            scroll={{ x: 2200 }}
            bordered
          />
        </Card>
      )}

      {!loading && pagos.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CalendarOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <p style={{ fontSize: 16, color: '#999' }}>No hay pagos registrados hoy</p>
            <p style={{ fontSize: 14, color: '#bbb' }}>Los pagos aparecerán aquí a medida que se registren</p>
          </div>
        </Card>
      )}

      <div style={{ marginTop: 40, textAlign: 'center', paddingBottom: 24 }}>
        <Button
          size="large"
          onClick={() => navigate('/dashboard')}
          style={{ minWidth: 200 }}
        >
          Regresar al Dashboard
        </Button>
      </div>
    </div>
  );
};

export default PagosHoy;

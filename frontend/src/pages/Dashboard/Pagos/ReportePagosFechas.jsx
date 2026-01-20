import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, message, Typography, Button, DatePicker, Input } from 'antd';
import { DownloadOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarDescargaExcel } from '../../../utils/bitacora';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ReportePagosFechas = () => {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    fechaInicial: null,
    fechaFinal: null,
    cicloEscolar: getCicloActual().toString(),
  });

  const buscarPagos = async () => {
    if (!filtros.fechaInicial || !filtros.fechaFinal) {
      message.warning('Por favor selecciona un rango de fechas');
      return;
    }

    if (!filtros.cicloEscolar || filtros.cicloEscolar.length !== 4) {
      message.warning('Por favor ingresa un ciclo escolar válido (4 dígitos)');
      return;
    }

    setPagos([]);
    setLoading(true);

    try {
      const params = new URLSearchParams({
        fechaInicial: filtros.fechaInicial,
        fechaFinal: filtros.fechaFinal,
        cicloEscolar: filtros.cicloEscolar,
      });

      const res = await apiClient.get(`/pagos/reporte?${params}`);

      if (res.data.success && res.data.data) {
        // El primer elemento del array contiene los datos reales con índices numéricos
        // El segundo elemento contiene metadatos de MySQL que debemos ignorar
        const datosReales = res.data.data[0];
        const pagosLimpios = Object.values(datosReales);

        setPagos(pagosLimpios);
        message.success(`${pagosLimpios.length} pago${pagosLimpios.length !== 1 ? 's' : ''} encontrado${pagosLimpios.length !== 1 ? 's' : ''}`);
      } else {
        setPagos([]);
        message.info('No se encontraron pagos en el rango de fechas seleccionado');
      }
    } catch (err) {
      message.error('Error al buscar pagos');
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
      title: 'Fecha',
      dataIndex: 'Fecha',
      width: 180,
      render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY HH:mm') : '-'
    },
  ];

  const exportarExcel = async () => {
    if (pagos.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Reporte de Pagos por Fechas');

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
      'Fecha': p.Fecha ? dayjs(p.Fecha).format('DD/MM/YYYY HH:mm') : '-'
    }));

    // Calcular total
    const total = pagos.reduce((sum, p) => sum + parseFloat(p.Monto || 0), 0);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A10' });

    const wscols = [
      { wch: 6 }, { wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 18 },
      { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 35 }, { wch: 18 }
    ];
    ws['!cols'] = wscols;

    XLSX.utils.sheet_add_aoa(ws, [['REPORTE DE PAGOS POR FECHAS']], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Período: ${filtros.fechaInicial} al ${filtros.fechaFinal} | Ciclo Escolar: ${filtros.cicloEscolar}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 12, italic: true }, alignment: { horizontal: 'center' } };

    const hoy = new Date().toLocaleDateString('es-GT');
    XLSX.utils.sheet_add_aoa(ws, [[`Generado el: ${hoy}`]], { origin: 'A4' });
    ws['A4'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Total de pagos: ${pagos.length} | Monto Total: Q ${total.toFixed(2)}`]], { origin: 'A6' });
    ws['A6'].s = { font: { name: 'Arial', sz: 11, bold: true }, alignment: { horizontal: 'center' } };

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Pagos');
    const filename = `Reporte_Pagos_${filtros.fechaInicial}_${filtros.fechaFinal}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), filename);
    message.success('Excel generado correctamente');
  };

  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setFiltros(prev => ({
        ...prev,
        fechaInicial: dates[0].format('YYYY-MM-DD'),
        fechaFinal: dates[1].format('YYYY-MM-DD')
      }));
    } else {
      setFiltros(prev => ({
        ...prev,
        fechaInicial: null,
        fechaFinal: null
      }));
    }
  };

  // Calcular total de montos
  const totalMonto = pagos.reduce((sum, pago) => sum + parseFloat(pago.Monto || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Reporte de Pagos por Fechas</Title>
      <Title level={5} type="secondary">Consulta pagos realizados en un rango de fechas específico</Title>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <div>
            <strong>Rango de Fechas *</strong>
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              onChange={handleDateChange}
            />
          </div>

          <div>
            <strong>Ciclo Escolar *</strong>
            <Input
              value={filtros.cicloEscolar}
              maxLength={4}
              placeholder="Ej: 2026"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setFiltros(prev => ({ ...prev, cicloEscolar: val }));
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={buscarPagos}
              loading={loading}
              block
              size="large"
            >
              Buscar Pagos
            </Button>
          </div>
        </div>
      </Card>

      {pagos.length > 0 && (
        <Card
          title={
            <div>
              <strong>{pagos.length} pago{pagos.length !== 1 ? 's' : ''} encontrado{pagos.length !== 1 ? 's' : ''}</strong>
              <div style={{ fontSize: '16px', color: '#1890ff', marginTop: 8 }}>
                Total: Q {totalMonto.toFixed(2)}
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

export default ReportePagosFechas;

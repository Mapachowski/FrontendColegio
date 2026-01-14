import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, message, Typography, Button, Select, Input, Tag } from 'antd';
import { DownloadOutlined, ReloadOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarDescargaExcel } from '../../../utils/bitacora';

const { Title } = Typography;
const { Option } = Select;

const Insolventes = () => {
  const navigate = useNavigate();
  const [insolventes, setInsolventes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cicloEscolar, setCicloEscolar] = useState(getCicloActual().toString());
  const [mes, setMes] = useState(new Date().getMonth() + 1); // 1-12

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  useEffect(() => {
    if (cicloEscolar && cicloEscolar.length === 4 && mes) {
      cargarInsolventes();
    }
  }, []);

  const cargarInsolventes = async () => {
    if (!cicloEscolar || cicloEscolar.length !== 4) {
      message.warning('Por favor ingresa un ciclo escolar válido (4 dígitos)');
      return;
    }

    if (!mes || mes < 1 || mes > 12) {
      message.warning('Por favor selecciona un mes válido');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.get(`/pagos/insolventes?cicloEscolar=${cicloEscolar}&mes=${mes}`);

      if (res.data.success && res.data.data) {
        // Extraer datos reales (primer elemento del array)
        const datosReales = res.data.data[0];
        const insolventesLimpios = Object.values(datosReales);

        setInsolventes(insolventesLimpios);

        if (insolventesLimpios.length > 0) {
          message.warning({
            content: `${insolventesLimpios.length} alumno${insolventesLimpios.length !== 1 ? 's' : ''} insolvente${insolventesLimpios.length !== 1 ? 's' : ''} encontrado${insolventesLimpios.length !== 1 ? 's' : ''}`,
            icon: <WarningOutlined style={{ color: '#faad14' }} />,
          });
        } else {
          message.success('No hay alumnos insolventes en este mes');
        }
      } else {
        setInsolventes([]);
        message.success('No hay alumnos insolventes');
      }
    } catch (err) {
      console.error('Error al cargar insolventes:', err);
      message.error('Error al cargar alumnos insolventes');
      setInsolventes([]);
    } finally {
      setLoading(false);
    }
  };

  const columnas = [
    {
      title: '#',
      render: (_, __, i) => i + 1,
      width: 60,
      fixed: 'left',
      align: 'center'
    },
    {
      title: 'Carnet',
      dataIndex: 'Carnet',
      width: 100,
      fixed: 'left',
      align: 'center'
    },
    {
      title: 'Matrícula',
      dataIndex: 'Matricula',
      width: 150,
      align: 'center'
    },
    {
      title: 'Nombre Completo',
      dataIndex: 'NombreAlumno',
      width: 280,
      ellipsis: true
    },
    {
      title: 'Grado',
      dataIndex: 'NombreGrado',
      width: 160
    },
    {
      title: 'Sección',
      dataIndex: 'NombreSeccion',
      width: 100,
      align: 'center'
    },
    {
      title: 'Jornada',
      dataIndex: 'NombreJornada',
      width: 120,
      align: 'center'
    },
    {
      title: 'Meses Pendientes',
      dataIndex: 'MesesPendientes',
      width: 200,
      render: (meses) => {
        if (!meses) return '-';
        const listaMeses = meses.split(',').map(m => m.trim());
        return (
          <div>
            {listaMeses.map((m, idx) => (
              <Tag key={idx} color="red" style={{ marginBottom: 4 }}>
                {m}
              </Tag>
            ))}
          </div>
        );
      }
    },
  ];

  const exportarExcel = async () => {
    if (insolventes.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Reporte de Alumnos Insolventes');

    const mesNombre = meses.find(m => m.value === mes)?.label || '';

    const filas = insolventes.map((alumno, i) => ({
      '#': i + 1,
      'Carnet': alumno.Carnet,
      'Matrícula': alumno.Matricula,
      'Nombre Completo': alumno.NombreAlumno,
      'Grado': alumno.NombreGrado,
      'Sección': alumno.NombreSeccion,
      'Jornada': alumno.NombreJornada,
      'Meses Pendientes': alumno.MesesPendientes || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A10' });

    const wscols = [
      { wch: 6 },   // #
      { wch: 12 },  // Carnet
      { wch: 18 },  // Matrícula
      { wch: 35 },  // Nombre
      { wch: 20 },  // Grado
      { wch: 10 },  // Sección
      { wch: 12 },  // Jornada
      { wch: 30 }   // Meses Pendientes
    ];
    ws['!cols'] = wscols;

    XLSX.utils.sheet_add_aoa(ws, [['ALUMNOS INSOLVENTES']], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Mes: ${mesNombre} | Ciclo Escolar: ${cicloEscolar}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 12, italic: true }, alignment: { horizontal: 'center' } };

    const fecha = dayjs().format('DD/MM/YYYY HH:mm');
    XLSX.utils.sheet_add_aoa(ws, [[`Generado: ${fecha}`]], { origin: 'A4' });
    ws['A4'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Total de alumnos insolventes: ${insolventes.length}`]], { origin: 'A6' });
    ws['A6'].s = { font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FF0000' } }, alignment: { horizontal: 'center' } };

    XLSX.utils.book_append_sheet(wb, ws, 'Insolventes');
    const filename = `Insolventes_${mesNombre}_${cicloEscolar}_${dayjs().format('DDMMYYYY')}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), filename);
    message.success('Excel generado correctamente');
  };

  const mesNombreActual = meses.find(m => m.value === mes)?.label || '';

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> Alumnos Insolventes
      </Title>
      <Title level={5} type="secondary">
        Listado de alumnos con pagos pendientes
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 200 }}>
            <strong>Ciclo Escolar *</strong>
            <Input
              value={cicloEscolar}
              maxLength={4}
              placeholder="Ej: 2025"
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCicloEscolar(val);
              }}
              size="large"
            />
          </div>

          <div style={{ minWidth: 200 }}>
            <strong>Mes *</strong>
            <Select
              value={mes}
              onChange={setMes}
              placeholder="Selecciona el mes"
              style={{ width: '100%' }}
              size="large"
            >
              {meses.map(m => (
                <Option key={m.value} value={m.value}>
                  {m.label}
                </Option>
              ))}
            </Select>
          </div>

          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={cargarInsolventes}
            loading={loading}
            size="large"
            danger
          >
            Buscar Insolventes
          </Button>
        </div>
      </Card>

      {insolventes.length > 0 && (
        <Card
          title={
            <div>
              <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
              <strong style={{ color: '#ff4d4f' }}>
                {insolventes.length} alumno{insolventes.length !== 1 ? 's' : ''} insolvente{insolventes.length !== 1 ? 's' : ''}
              </strong>
              <span style={{ marginLeft: 12, color: '#666', fontSize: 14 }}>
                Mes: {mesNombreActual} {cicloEscolar}
              </span>
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
            dataSource={insolventes}
            rowKey={(record, index) => `${record.Carnet}-${index}`}
            loading={loading}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: ['25', '50', '100', '200'],
              showTotal: (total) => `Total: ${total} alumnos insolventes`
            }}
            scroll={{ x: 1200 }}
            bordered
            rowClassName={() => 'insolvente-row'}
          />
        </Card>
      )}

      {!loading && insolventes.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ExclamationCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <p style={{ fontSize: 16, color: '#52c41a', fontWeight: 'bold' }}>
              ¡Excelente! No hay alumnos insolventes
            </p>
            <p style={{ fontSize: 14, color: '#999' }}>
              Todos los alumnos están al día con sus pagos de {mesNombreActual}
            </p>
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

      <style jsx>{`
        .insolvente-row {
          background-color: #fff1f0;
        }
        .insolvente-row:hover {
          background-color: #ffe7e6 !important;
        }
      `}</style>
    </div>
  );
};

export default Insolventes;

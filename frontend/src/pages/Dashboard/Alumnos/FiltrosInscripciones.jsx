// src/pages/dashboard/Alumnos/FiltrosInscripciones.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Select, Button, Table, message, Typography } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarDescargaExcel } from '../../../utils/bitacora';

const { Title } = Typography;

const FiltrosInscripciones = () => {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({
    p_CicloEscolar: getCicloActual().toString(),
    IdGrado: null,
    IdSeccion: null,
    IdJornada: null,
  });

  const [catalogos, setCatalogos] = useState({
    grados: [],
    secciones: [],
    jornadas: [],
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // CARGAR CATÁLOGOS
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [gradosRes, seccionesRes, jornadasRes] = await Promise.all([
          apiClient.get('/grados'),
          apiClient.get('/secciones'),
          apiClient.get('/jornadas'),
        ]);

        const grados = gradosRes.data.data || [];
        const secciones = seccionesRes.data.data || [];
        const jornadas = jornadasRes.data.data || [];

        setCatalogos({ grados, secciones, jornadas });
        message.success('Catálogos cargados');
      } catch (err) {
        message.error('Error al cargar catálogos');
      }
    };
    cargarCatalogos();
  }, []);

  // BUSCAR
  const buscar = async () => {
    if (filtros.p_CicloEscolar.length !== 4) {
      message.warning('El año debe tener 4 dígitos');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        p_CicloEscolar: filtros.p_CicloEscolar,
      });

      if (filtros.IdGrado !== null) params.append('IdGrado', filtros.IdGrado);
      if (filtros.IdSeccion !== null) params.append('IdSeccion', filtros.IdSeccion);
      if (filtros.IdJornada !== null) params.append('IdJornada', filtros.IdJornada);

      const res = await apiClient.get('/inscripciones/filtros', { params });

      if (res.data.success && res.data.data?.[0]) {
        const raw = res.data.data[0];
        const alumnos = Object.values(raw)
          .filter(item => item && typeof item === 'object')
          .map(item => item)
          .sort((a, b) => {
            // Ordenar primero por Apellidos
            const apellidoCompare = (a.Apellidos || '').localeCompare(b.Apellidos || '');
            if (apellidoCompare !== 0) return apellidoCompare;
            // Si los apellidos son iguales, ordenar por Nombres
            return (a.Nombres || '').localeCompare(b.Nombres || '');
          });

        setData(alumnos);
        message.success(`${alumnos.length} alumno${alumnos.length !== 1 ? 's' : ''} encontrado${alumnos.length !== 1 ? 's' : ''}`);
      } else {
        setData([]);
        message.info('No hay alumnos con esos filtros');
      }
    } catch (err) {
      message.error('Error al buscar');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda automática
  useEffect(() => {
    if (filtros.p_CicloEscolar.length === 4) {
      const timer = setTimeout(buscar, 600);
      return () => clearTimeout(timer);
    }
  }, [filtros]);

// ← REEMPLAZA toda la función exportarExcel con esta ↓
const exportarExcel = async () => {
  if (data.length === 0) return message.info('No hay datos para exportar');

  // Registrar en bitácora
  await registrarDescargaExcel('Listado de Alumnos Inscritos');

  // Nombres de filtros para el reporte
  const grado = catalogos.grados.find(g => g.IdGrado === filtros.IdGrado)?.NombreGrado || 'Todos los grados';
  const seccion = catalogos.secciones.find(s => s.IdSeccion === filtros.IdSeccion)?.NombreSeccion || 'Todas las secciones';
  const jornada = catalogos.jornadas.find(j => j.IdJornada === filtros.IdJornada)?.NombreJornada || 'Todas las jornadas';

  // Datos limpios para la tabla
  const filas = data.map((a, i) => ({
    '#': i + 1,
    'Carnet': a.IdAlumno,
    'Matrícula': a.Matricula || '-',
    'Nombres': a.Nombres,
    'Apellidos': a.Apellidos,
    'Grado': a.NombreGrado,
    'Sección': a.NombreSeccion,
    'Jornada': a.NombreJornada,
  }));

  // Crear libro y hoja
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A10' }); // Empezamos en fila 10 para dejar espacio arriba

  // === ESTILOS Y DISEÑO ===
  const wscols = [
    { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 22 },
    { wch: 25 }, { wch: 22 }, { wch: 12 }, { wch: 15 }
  ];
  ws['!cols'] = wscols;

  // Título grande
  XLSX.utils.sheet_add_aoa(ws, [['LISTADO OFICIAL DE ALUMNOS INSCRITOS']], { origin: 'A1' });
  ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

  // Subtítulo con filtros
  XLSX.utils.sheet_add_aoa(ws, [[`Ciclo Escolar: ${filtros.p_CicloEscolar} | Grado: ${grado} | Sección: ${seccion} | Jornada: ${jornada}`]], { origin: 'A3' });
  ws['A3'].s = { font: { name: 'Arial', sz: 12, italic: true }, alignment: { horizontal: 'center' } };

  // Fecha de generación
  const hoy = new Date().toLocaleDateString('es-GT');
  XLSX.utils.sheet_add_aoa(ws, [[`Generado el: ${hoy}`]], { origin: 'A4' });
  ws['A4'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

  // Encabezados con color
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "10";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E40AF" } },
      alignment: { horizontal: 'center' }
    };
  }

  // Bordes a toda la tabla
  const dataRange = XLSX.utils.decode_range('A10:H' + (10 + filas.length - 1));
  for (let R = dataRange.s.r; R <= dataRange.e.r; ++R) {
    for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell) {
        cell.s = {
          ...(cell.s || {}),
          border: {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' }
          }
        };
      }
    }
  }

  // === INSERTAR LOGO ===
  if (typeof window !== 'undefined') {
    const img = new Image();
    img.src = '/logo-colegio.png'; // ← Ruta pública

    img.onload = () => {
      const imgWidth = 120;  // ancho en píxeles
      const imgHeight = 120;
      const images = [{
        image: img.src,
        tl: { col: 0, row: 0 },
        ext: { width: imgWidth, height: imgHeight },
        type: "picture"
      }];
      ws['!images'] = images;

      // Añadir hoja al libro y descargar
      XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
      const filename = `Listado_Inscritos_${filtros.p_CicloEscolar}_${grado.replace(/ /g, '_')} ${seccion} ${jornada}.xlsx`;
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), filename);
      message.success('Excel con logo generado');
    };

    img.onerror = () => {
      XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
      const filename = `Listado_Inscritos_${filtros.p_CicloEscolar}.xlsx`;
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([excelBuffer]), filename);
      message.success('Excel generado (sin logo)');
    };
  }
};

  // COLUMNAS DE LA TABLA (sin mensualidad ni ciclo)
  const columns = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Carnet', dataIndex: 'IdAlumno', width: 110 },
    { title: 'Matrícula', dataIndex: 'Matricula', width: 130 },
    { title: 'Nombres', dataIndex: 'Nombres' },
    { title: 'Apellidos', dataIndex: 'Apellidos' },
    { title: 'Grado', dataIndex: 'NombreGrado', width: 200 },
    { title: 'Sección', dataIndex: 'NombreSeccion', width: 90 },
    { title: 'Jornada', dataIndex: 'NombreJornada', width: 120 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Listado de Alumnos Inscritos</Title>
      <Title level={5} type="secondary">Ciclo actual: {getCicloActual()}</Title>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <strong>Ciclo Escolar *</strong>
            <Input
              value={filtros.p_CicloEscolar}
              maxLength={4}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0,4);
                setFiltros(p => ({ ...p, p_CicloEscolar: val }));
              }}
            />
          </div>

          <div>
            <strong>Grado</strong>
            <Select
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              placeholder="Todos los grados"
              value={filtros.IdGrado}
              onChange={(v) => setFiltros(p => ({ ...p, IdGrado: v }))}
            >
              <Select.Option value={null}>Todos los grados</Select.Option>
              {catalogos.grados.map(g => (
                <Select.Option key={g.IdGrado} value={g.IdGrado}>
                  {g.NombreGrado}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <strong>Sección</strong>
            <Select
              style={{ width: '100%' }}
              placeholder="Todas las secciones"
              value={filtros.IdSeccion}
              onChange={(v) => setFiltros(p => ({ ...p, IdSeccion: v }))}
            >
              <Select.Option value={null}>Todas las secciones</Select.Option>
              {catalogos.secciones.map(s => (
                <Select.Option key={s.IdSeccion} value={s.IdSeccion}>
                  {s.NombreSeccion}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <strong>Jornada</strong>
            <Select
              style={{ width: '100%' }}
              placeholder="Todas las jornadas"
              value={filtros.IdJornada}
              onChange={(v) => setFiltros(p => ({ ...p, IdJornada: v }))}
            >
              <Select.Option value={null}>Todas las jornadas</Select.Option>
              {catalogos.jornadas.map(j => (
                <Select.Option key={j.IdJornada} value={j.IdJornada}>
                  {j.NombreJornada}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={buscar} loading={loading} block size="large">
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {data.length > 0 && (
        <Card
          title={<strong>{data.length} alumno{data.length > 1 ? 's' : ''} encontrado{data.length > 1 ? 's' : ''}</strong>}
          extra={
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportarExcel} size="large">
              Exportar Excel
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={data}
            rowKey="IdAlumno"
            pagination={{ pageSize: 30 }}
            scroll={{ x: 1000 }}
            bordered
          />
        </Card>
      )}

      {/* BOTÓN REGRESAR AL DASHBOARD */}
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

export default FiltrosInscripciones;
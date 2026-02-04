// src/pages/Dashboard/Alumnos/ListadoResponsables.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, message, Typography, Button, Select, Input, Tabs, Checkbox } from 'antd';
import { DownloadOutlined, TeamOutlined, UserOutlined, FilterOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarDescargaExcel } from '../../../utils/bitacora';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ListadoResponsables = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');

  // Estados para Listado 1: Responsables Actuales
  const [responsablesActivos, setResponsablesActivos] = useState([]);
  const [loadingActivos, setLoadingActivos] = useState(false);
  const [mostrarTodosActivos, setMostrarTodosActivos] = useState(false);

  // Estados para Listado 2: Familias Completas
  const [familiasCompletas, setFamiliasCompletas] = useState([]);
  const [loadingFamilias, setLoadingFamilias] = useState(false);
  const [mostrarResponsablesFamilias, setMostrarResponsablesFamilias] = useState('no'); // 'si' o 'no'

  // Estados para Listado 3: Responsables por Grado
  const [responsablesPorGrado, setResponsablesPorGrado] = useState([]);
  const [loadingPorGrado, setLoadingPorGrado] = useState(false);
  const [mostrarTodosPorGrado, setMostrarTodosPorGrado] = useState(false);
  const [mostrarPorResponsable, setMostrarPorResponsable] = useState(false); // false = por familia (default), true = por responsable
  const [filtros, setFiltros] = useState({
    p_CicloEscolar: getCicloActual().toString(),
    IdGrado: null,
    IdSeccion: null,
    IdJornada: null,
  });

  // Catálogos
  const [catalogos, setCatalogos] = useState({
    grados: [],
    secciones: [],
    jornadas: [],
  });

  const cargarCatalogos = async () => {
    try {
      const [gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/grados'),
        apiClient.get('/secciones'),
        apiClient.get('/jornadas'),
      ]);

      const grados = gradosRes.data.data || gradosRes.data || [];
      const secciones = seccionesRes.data.data || seccionesRes.data || [];
      const jornadas = jornadasRes.data.data || jornadasRes.data || [];

      setCatalogos({
        grados: Array.isArray(grados) ? grados : [],
        secciones: Array.isArray(secciones) ? secciones : [],
        jornadas: Array.isArray(jornadas) ? jornadas : []
      });
    } catch (err) {
      message.error('Error al cargar catálogos');
    }
  };

  // ==================== LISTADO 1: RESPONSABLES ACTIVOS ====================
  const cargarResponsablesActivos = useCallback(async () => {
    setLoadingActivos(true);
    try {
      // Agregar parámetro soloResponsables si no está marcado "Mostrar Todos"
      const params = mostrarTodosActivos ? {} : { soloResponsables: true };
      const res = await apiClient.get('/responsables/activos', { params });

      if (res.data.success && res.data.data) {
        // El primer elemento del array contiene los datos reales con índices numéricos
        const datosReales = res.data.data[0];
        const responsablesLimpios = Object.values(datosReales);

        setResponsablesActivos(responsablesLimpios);
        message.success(`${responsablesLimpios.length} responsable${responsablesLimpios.length !== 1 ? 's' : ''} encontrado${responsablesLimpios.length !== 1 ? 's' : ''}`);
      } else {
        setResponsablesActivos([]);
        message.info('No hay responsables activos');
      }
    } catch (err) {
      message.error('Error al cargar responsables activos');
      setResponsablesActivos([]);
    } finally {
      setLoadingActivos(false);
    }
  }, [mostrarTodosActivos]);

  const columnasResponsablesActivos = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Nombre Completo', dataIndex: 'NombreResponsable', width: 250 },
    { title: 'DPI', dataIndex: 'DPI', width: 150, render: (text) => text || '-' },
    { title: 'NIT', dataIndex: 'NIT', width: 120, render: (text) => text || '-' },
    { title: 'Teléfono Contacto', dataIndex: 'TelefonoContacto', width: 150, render: (text) => text || '-' },
    { title: 'Cantidad Hijos', dataIndex: 'CantidadHijos', width: 130, align: 'center' },
    {
      title: 'Nombres de Hijos',
      dataIndex: 'NombresHijos',
      width: 400,
      render: (text) => text || '-'
    },
  ];

  const exportarResponsablesActivos = async () => {
    if (responsablesActivos.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Listado de Responsables Activos');

    const filas = responsablesActivos.map((r, i) => ({
      '#': i + 1,
      'Nombre Completo': r.NombreResponsable,
      'DPI': r.DPI || '-',
      'NIT': r.NIT || '-',
      'Teléfono Contacto': r.TelefonoContacto || '-',
      'Cantidad Hijos': r.CantidadHijos,
      'Nombres de Hijos': r.NombresHijos || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A8' });

    const wscols = [
      { wch: 6 }, { wch: 35 }, { wch: 18 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 60 }
    ];
    ws['!cols'] = wscols;

    XLSX.utils.sheet_add_aoa(ws, [['LISTADO DE RESPONSABLES ACTIVOS']], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    const hoy = new Date().toLocaleDateString('es-GT');
    XLSX.utils.sheet_add_aoa(ws, [[`Generado el: ${hoy}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    XLSX.utils.book_append_sheet(wb, ws, 'Responsables Activos');
    const filename = `Responsables_Activos_${hoy.replace(/\//g, '-')}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), filename);
    message.success('Excel generado correctamente');
  };

  // ==================== LISTADO 2: FAMILIAS COMPLETAS ====================
  const cargarFamiliasCompletas = useCallback(async () => {
    setLoadingFamilias(true);
    try {
      const res = await apiClient.get('/familias/completas');

      if (res.data.success && res.data.data) {
        // El primer elemento del array contiene los datos reales con índices numéricos
        const datosReales = res.data.data[0];
        const familiasLimpias = Object.values(datosReales);

        // Parsear el campo Hijos (puede venir como array o string JSON)
        const familiasConHijos = familiasLimpias.map(familia => ({
          ...familia,
          HijosParsed: Array.isArray(familia.Hijos)
            ? familia.Hijos
            : (familia.Hijos ? JSON.parse(familia.Hijos) : [])
        }));

        setFamiliasCompletas(familiasConHijos);
        message.success(`${familiasConHijos.length} familia${familiasConHijos.length !== 1 ? 's' : ''} encontrada${familiasConHijos.length !== 1 ? 's' : ''}`);
      } else {
        setFamiliasCompletas([]);
        message.info('No hay familias registradas');
      }
    } catch (err) {
      message.error('Error al cargar familias completas');
      setFamiliasCompletas([]);
    } finally {
      setLoadingFamilias(false);
    }
  }, []);

  // Cargar catálogos al montar componente
  useEffect(() => {
    cargarCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (activeTab === '1') {
      cargarResponsablesActivos();
    } else if (activeTab === '2') {
      cargarFamiliasCompletas();
    }
  }, [activeTab, cargarResponsablesActivos, cargarFamiliasCompletas]);

  // Recargar cuando cambie el checkbox de mostrar todos en Responsables Activos
  useEffect(() => {
    if (activeTab === '1') {
      cargarResponsablesActivos();
    }
  }, [activeTab, mostrarTodosActivos, cargarResponsablesActivos]);

  // Ejecutar búsqueda automática cuando cambien los filtros en "Por Grado del Hijo"
  useEffect(() => {
    // Solo ejecutar si ya hay resultados previos (ya se buscó una vez) y estamos en la pestaña 3
    if (activeTab === '3' && responsablesPorGrado.length > 0 && filtros.IdGrado) {
      buscarPorGrado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.IdGrado, filtros.IdSeccion, filtros.IdJornada, filtros.p_CicloEscolar, mostrarPorResponsable, mostrarTodosPorGrado]);

  // Columnas dinámicas basadas en si se muestran responsables o no
  const getColumnasFamilias = () => {
    const columnasBase = [
      { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
      { title: 'Nombre Familia', dataIndex: 'NombreFamilia', width: 200 },
      { title: 'Teléfono Contacto', dataIndex: 'TelefonoContacto', width: 150, render: (text) => text || '-' },
    ];

    if (mostrarResponsablesFamilias === 'si') {
      // Mostrar columnas de responsables individuales (sin tipo)
      return [
        ...columnasBase,
        {
          title: 'Responsable 1',
          width: 250,
          render: (_, record) => record.Responsable1Nombre || '-'
        },
        {
          title: 'Responsable 2',
          width: 250,
          render: (_, record) => record.Responsable2Nombre || '-'
        },
        {
          title: 'Responsable 3',
          width: 250,
          render: (_, record) => record.Responsable3Nombre || '-'
        },
        {
          title: 'Cantidad Hijos',
          width: 130,
          align: 'center',
          render: (_, record) => record.HijosParsed?.length || 0
        },
        {
          title: 'Hijos',
          width: 400,
          render: (_, record) => {
            if (!record.HijosParsed || record.HijosParsed.length === 0) return '-';
            return record.HijosParsed.map(h => h.NombreCompleto).join(', ');
          }
        },
      ];
    } else {
      // Mostrar vista simple sin responsables individuales
      return [
        ...columnasBase,
        {
          title: 'Cantidad Hijos',
          width: 130,
          align: 'center',
          render: (_, record) => record.HijosParsed?.length || 0
        },
        {
          title: 'Hijos',
          width: 400,
          render: (_, record) => {
            if (!record.HijosParsed || record.HijosParsed.length === 0) return '-';
            return record.HijosParsed.map(h => h.NombreCompleto).join(', ');
          }
        },
      ];
    }
  };

  const exportarFamiliasCompletas = async () => {
    if (familiasCompletas.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Listado de Familias Completas');

    const filas = familiasCompletas.map((f, i) => ({
      '#': i + 1,
      'Nombre Familia': f.NombreFamilia,
      'Teléfono Contacto': f.TelefonoContacto || '-',
      'Responsable 1': f.Responsable1Nombre || '-',
      'Tipo 1': f.Responsable1Tipo || '-',
      'DPI 1': f.Responsable1DPI || '-',
      'Responsable 2': f.Responsable2Nombre || '-',
      'Tipo 2': f.Responsable2Tipo || '-',
      'DPI 2': f.Responsable2DPI || '-',
      'Responsable 3': f.Responsable3Nombre || '-',
      'Tipo 3': f.Responsable3Tipo || '-',
      'DPI 3': f.Responsable3DPI || '-',
      'Cantidad Hijos': f.HijosParsed?.length || 0,
      'Hijos': f.HijosParsed?.map(h => `${h.NombreCompleto} (${h.Grado} ${h.Seccion})`).join('; ') || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A8' });

    const wscols = [
      { wch: 6 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 18 },
      { wch: 30 }, { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 80 }
    ];
    ws['!cols'] = wscols;

    XLSX.utils.sheet_add_aoa(ws, [['LISTADO DE FAMILIAS COMPLETAS']], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    const hoy = new Date().toLocaleDateString('es-GT');
    XLSX.utils.sheet_add_aoa(ws, [[`Generado el: ${hoy}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    XLSX.utils.book_append_sheet(wb, ws, 'Familias Completas');
    const filename = `Familias_Completas_${hoy.replace(/\//g, '-')}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), filename);
    message.success('Excel generado correctamente');
  };

  // ==================== LISTADO 3: RESPONSABLES POR GRADO ====================
  const buscarPorGrado = async () => {
    if (!filtros.IdGrado) {
      message.warning('Por favor selecciona un grado');
      return;
    }

    // Limpiar la tabla antes de buscar
    setResponsablesPorGrado([]);
    setLoadingPorGrado(true);

    try {
      let res;

      if (mostrarPorResponsable) {
        // Mostrar por Responsable - usa endpoint /responsables/por-grado
        const params = new URLSearchParams({
          p_CicloEscolar: filtros.p_CicloEscolar,
          IdGrado: filtros.IdGrado,
        });

        if (filtros.IdSeccion) params.append('IdSeccion', filtros.IdSeccion);
        if (filtros.IdJornada) params.append('IdJornada', filtros.IdJornada);

        // Agregar parámetro soloResponsables si no está marcado "Mostrar Todos"
        if (!mostrarTodosPorGrado) params.append('soloResponsables', 'true');

        res = await apiClient.get('/responsables/por-grado', { params });
      } else {
        // Mostrar por Familia (DEFAULT) - usa endpoint /familias/familias-hijos-por-grado
        const params = new URLSearchParams({
          p_CicloEscolar: filtros.p_CicloEscolar,
          IdGrado: filtros.IdGrado,
        });

        if (filtros.IdSeccion) params.append('IdSeccion', filtros.IdSeccion);
        if (filtros.IdJornada) params.append('IdJornada', filtros.IdJornada);

        res = await apiClient.get('/familias/familias-hijos-por-grado', { params });
      }

      if (res.data.success && res.data.data) {
        // El primer elemento del array contiene los datos reales con índices numéricos
        const datosReales = res.data.data[0];

        // Extraer solo los objetos que tienen datos (ignorar metadatos)
        const responsablesLimpios = Object.values(datosReales);

        setResponsablesPorGrado(responsablesLimpios);
        message.success(`${responsablesLimpios.length} registro${responsablesLimpios.length !== 1 ? 's' : ''} encontrado${responsablesLimpios.length !== 1 ? 's' : ''}`);
      } else {
        setResponsablesPorGrado([]);
        message.info('No se encontraron datos con esos filtros');
      }
    } catch (err) {
      message.error('Error al buscar datos por grado');
      setResponsablesPorGrado([]);
    } finally {
      setLoadingPorGrado(false);
    }
  };

  // Columnas dinámicas según el modo (familias o responsables)
  const getColumnasResponsablesPorGrado = () => {
    if (mostrarPorResponsable) {
      // Vista por Responsable (antigua vista)
      return [
        { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
        { title: 'Responsable', dataIndex: 'NombreResponsable', width: 250 },
        { title: 'DPI', dataIndex: 'DPI', width: 150, render: (text) => text || '-' },
        { title: 'NIT', dataIndex: 'NIT', width: 120, render: (text) => text || '-' },
        { title: 'Teléfono Contacto', dataIndex: 'TelefonoContacto', width: 150, render: (text) => text || '-' },
        { title: 'Carnet Hijo', dataIndex: 'IdAlumno', width: 120 },
        { title: 'Nombre Hijo', dataIndex: 'NombreHijo', width: 250 },
        { title: 'Grado', dataIndex: 'Grado', width: 180 },
        { title: 'Sección', dataIndex: 'Seccion', width: 100 },
        { title: 'Jornada', dataIndex: 'Jornada', width: 120 },
        { title: 'Familia', dataIndex: 'NombreFamilia', width: 200 },
      ];
    } else {
      // Vista por Familia (nueva vista - DEFAULT)
      return [
        { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
        { title: 'Familia', dataIndex: 'Familia', width: 200 },
        { title: 'Carnet Hijo', dataIndex: 'CarnetHijo', width: 120 },
        { title: 'Nombre Alumno', dataIndex: 'NombreAlumno', width: 250 },
        { title: 'DPI Responsable', dataIndex: 'DPIResponsable', width: 150, render: (text) => text || '-' },
        { title: 'NIT Responsable', dataIndex: 'NITREsponsable', width: 120, render: (text) => text || '-' },
        { title: 'Teléfono Contacto', dataIndex: 'TelefonoContacto', width: 150, render: (text) => text || '-' },
        { title: 'Grado', dataIndex: 'Grado', width: 180 },
        { title: 'Sección', dataIndex: 'Seccion', width: 100 },
        { title: 'Jornada', dataIndex: 'Jornada', width: 120 },
      ];
    }
  };

  const exportarResponsablesPorGrado = async () => {
    if (responsablesPorGrado.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Listado de Responsables por Grado');

    const grado = catalogos.grados.find(g => g.IdGrado === filtros.IdGrado)?.NombreGrado || 'Todos';
    const seccion = catalogos.secciones.find(s => s.IdSeccion === filtros.IdSeccion)?.NombreSeccion || 'Todas';
    const jornada = catalogos.jornadas.find(j => j.IdJornada === filtros.IdJornada)?.NombreJornada || 'Todas';

    let filas;
    let wscols;
    let titulo;

    if (mostrarPorResponsable) {
      // Vista por Responsable
      titulo = 'LISTADO DE RESPONSABLES POR GRADO';
      filas = responsablesPorGrado.map((r, i) => ({
        '#': i + 1,
        'Responsable': r.NombreResponsable,
        'DPI': r.DPI || '-',
        'NIT': r.NIT || '-',
        'Teléfono Contacto': r.TelefonoContacto || '-',
        'Carnet Hijo': r.IdAlumno,
        'Nombre Hijo': r.NombreHijo,
        'Grado': r.Grado,
        'Sección': r.Seccion,
        'Jornada': r.Jornada,
        'Familia': r.NombreFamilia
      }));

      wscols = [
        { wch: 6 },   // #
        { wch: 35 },  // Responsable
        { wch: 18 },  // DPI
        { wch: 15 },  // NIT
        { wch: 18 },  // Teléfono Contacto
        { wch: 15 },  // Carnet Hijo
        { wch: 35 },  // Nombre Hijo
        { wch: 22 },  // Grado
        { wch: 12 },  // Sección
        { wch: 15 },  // Jornada
        { wch: 25 }   // Familia
      ];
    } else {
      // Vista por Familia
      titulo = 'LISTADO DE FAMILIAS POR GRADO';
      filas = responsablesPorGrado.map((r, i) => ({
        '#': i + 1,
        'Familia': r.Familia,
        'Carnet Hijo': r.CarnetHijo,
        'Nombre Alumno': r.NombreAlumno,
        'DPI Responsable': r.DPIResponsable || '-',
        'NIT Responsable': r.NITREsponsable || '-',
        'Teléfono Contacto': r.TelefonoContacto || '-',
        'Grado': r.Grado,
        'Sección': r.Seccion,
        'Jornada': r.Jornada
      }));

      wscols = [
        { wch: 6 },   // #
        { wch: 25 },  // Familia
        { wch: 15 },  // Carnet Hijo
        { wch: 35 },  // Nombre Alumno
        { wch: 18 },  // DPI Responsable
        { wch: 15 },  // NIT Responsable
        { wch: 18 },  // Teléfono Contacto
        { wch: 22 },  // Grado
        { wch: 12 },  // Sección
        { wch: 15 }   // Jornada
      ];
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A10' });
    ws['!cols'] = wscols;

    XLSX.utils.sheet_add_aoa(ws, [[titulo]], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Ciclo: ${filtros.p_CicloEscolar} | Grado: ${grado} | Sección: ${seccion} | Jornada: ${jornada}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 12, italic: true }, alignment: { horizontal: 'center' } };

    const hoy = new Date().toLocaleDateString('es-GT');
    XLSX.utils.sheet_add_aoa(ws, [[`Generado el: ${hoy}`]], { origin: 'A4' });
    ws['A4'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    const sheetName = mostrarPorResponsable ? 'Responsables por Grado' : 'Familias por Grado';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = mostrarPorResponsable
      ? `Responsables_Grado_${grado.replace(/ /g, '_')}_${hoy.replace(/\//g, '-')}.xlsx`
      : `Familias_Grado_${grado.replace(/ /g, '_')}_${hoy.replace(/\//g, '-')}.xlsx`;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), filename);
    message.success('Excel generado correctamente');
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Listado de Responsables</Title>
      <Title level={5} type="secondary">Reportes de responsables y familias del sistema</Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        {/* PESTAÑA 1: RESPONSABLES ACTIVOS */}
        <TabPane
          tab={
            <span>
              <UserOutlined />
              Responsables Actuales
            </span>
          }
          key="1"
        >
          <Card
            title={<strong>{responsablesActivos.length} responsable{responsablesActivos.length !== 1 ? 's' : ''} activo{responsablesActivos.length !== 1 ? 's' : ''}</strong>}
            extra={
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Checkbox
                  checked={mostrarTodosActivos}
                  onChange={(e) => setMostrarTodosActivos(e.target.checked)}
                >
                  Mostrar todos los responsables
                </Checkbox>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportarResponsablesActivos}
                  disabled={responsablesActivos.length === 0}
                >
                  Exportar Excel
                </Button>
              </div>
            }
          >
            <Table
              columns={columnasResponsablesActivos}
              dataSource={responsablesActivos}
              rowKey="IdResponsable"
              loading={loadingActivos}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                pageSizeOptions: ['25', '50', '100', '200'],
                showTotal: (total) => `Total: ${total} responsables`
              }}
              scroll={{ x: 1500 }}
              bordered
            />
          </Card>
        </TabPane>

        {/* PESTAÑA 2: FAMILIAS COMPLETAS */}
        <TabPane
          tab={
            <span>
              <TeamOutlined />
              Familias Completas
            </span>
          }
          key="2"
        >
          <Card
            title={<strong>{familiasCompletas.length} familia{familiasCompletas.length !== 1 ? 's' : ''}</strong>}
            extra={
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Mostrar Responsables:</span>
                  <Select
                    value={mostrarResponsablesFamilias}
                    onChange={(value) => setMostrarResponsablesFamilias(value)}
                    style={{ width: 100 }}
                  >
                    <Option value="no">No</Option>
                    <Option value="si">Sí</Option>
                  </Select>
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportarFamiliasCompletas}
                  disabled={familiasCompletas.length === 0}
                >
                  Exportar Excel
                </Button>
              </div>
            }
          >
            <Table
              columns={getColumnasFamilias()}
              dataSource={familiasCompletas}
              rowKey="IdFamilia"
              loading={loadingFamilias}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                pageSizeOptions: ['25', '50', '100', '200'],
                showTotal: (total) => `Total: ${total} familias`
              }}
              scroll={{ x: 1800 }}
              bordered
            />
          </Card>
        </TabPane>

        {/* PESTAÑA 3: RESPONSABLES POR GRADO */}
        <TabPane
          tab={
            <span>
              <FilterOutlined />
              Por Grado del Hijo
            </span>
          }
          key="3"
        >
          <Card style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 24, flexDirection: 'column' }}>
              <Checkbox
                checked={mostrarPorResponsable}
                onChange={(e) => {
                  setMostrarPorResponsable(e.target.checked);
                  // Si se desmarca, limpiar la tabla para forzar nueva búsqueda
                  if (!e.target.checked) {
                    setMostrarTodosPorGrado(false);
                  }
                }}
              >
                Mostrar por responsable
              </Checkbox>

              {mostrarPorResponsable && (
                <div style={{ marginLeft: 24 }}>
                  <Checkbox
                    checked={mostrarTodosPorGrado}
                    onChange={(e) => setMostrarTodosPorGrado(e.target.checked)}
                  >
                    Mostrar todos los responsables
                  </Checkbox>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <strong>Ciclo Escolar *</strong>
                <Input
                  value={filtros.p_CicloEscolar}
                  maxLength={4}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFiltros(p => ({ ...p, p_CicloEscolar: val }));
                  }}
                />
              </div>

              <div>
                <strong>Grado *</strong>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Selecciona un grado"
                  value={filtros.IdGrado}
                  onChange={(v) => setFiltros(p => ({ ...p, IdGrado: v }))}
                >
                  {catalogos.grados.map(g => (
                    <Select.Option key={g.IdGrado} value={g.IdGrado}>
                      {g.NombreGrado}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <strong>Sección (Opcional)</strong>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Todas"
                  value={filtros.IdSeccion}
                  onChange={(v) => setFiltros(p => ({ ...p, IdSeccion: v }))}
                  allowClear
                >
                  {catalogos.secciones.map(s => (
                    <Select.Option key={s.IdSeccion} value={s.IdSeccion}>
                      {s.NombreSeccion}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div>
                <strong>Jornada (Opcional)</strong>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Todas"
                  value={filtros.IdJornada}
                  onChange={(v) => setFiltros(p => ({ ...p, IdJornada: v }))}
                  allowClear
                >
                  {catalogos.jornadas.map(j => (
                    <Select.Option key={j.IdJornada} value={j.IdJornada}>
                      {j.NombreJornada}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<FilterOutlined />}
                  onClick={buscarPorGrado}
                  loading={loadingPorGrado}
                  block
                  size="large"
                >
                  Buscar
                </Button>
              </div>
            </div>
          </Card>

          {responsablesPorGrado.length > 0 && (
            <Card
              title={<strong>{responsablesPorGrado.length} registro{responsablesPorGrado.length !== 1 ? 's' : ''} encontrado{responsablesPorGrado.length !== 1 ? 's' : ''}</strong>}
              extra={
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportarResponsablesPorGrado}
                >
                  Exportar Excel
                </Button>
              }
            >
              <Table
                columns={getColumnasResponsablesPorGrado()}
                dataSource={responsablesPorGrado}
                rowKey={(record, index) => mostrarPorResponsable ? `${record.IdResponsable}-${record.IdAlumno}-${index}` : `${record.CarnetHijo}-${index}`}
                loading={loadingPorGrado}
                pagination={{
                  pageSize: 50,
                  showSizeChanger: true,
                  pageSizeOptions: ['25', '50', '100', '200'],
                  showTotal: (total) => `Total: ${total} registros`
                }}
                scroll={{ x: 1900 }}
                bordered
              />
            </Card>
          )}
        </TabPane>
      </Tabs>

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

export default ListadoResponsables;

// src/pages/Dashboard/Alumnos/ListadoResponsables.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, message, Typography, Button, Select, Input, Tabs } from 'antd';
import { DownloadOutlined, TeamOutlined, UserOutlined, FilterOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { registrarDescargaExcel } from '../../../utils/bitacora';

const { Title } = Typography;
const { TabPane } = Tabs;

const ListadoResponsables = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('1');

  // Estados para Listado 1: Responsables Actuales
  const [responsablesActivos, setResponsablesActivos] = useState([]);
  const [loadingActivos, setLoadingActivos] = useState(false);

  // Estados para Listado 2: Familias Completas
  const [familiasCompletas, setFamiliasCompletas] = useState([]);
  const [loadingFamilias, setLoadingFamilias] = useState(false);

  // Estados para Listado 3: Responsables por Grado
  const [responsablesPorGrado, setResponsablesPorGrado] = useState([]);
  const [loadingPorGrado, setLoadingPorGrado] = useState(false);
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

  // Cargar catálogos al montar componente
  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (activeTab === '1') {
      cargarResponsablesActivos();
    } else if (activeTab === '2') {
      cargarFamiliasCompletas();
    }
  }, [activeTab]);

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
      console.error('Error al cargar catálogos:', err);
      message.error('Error al cargar catálogos');
    }
  };

  // ==================== LISTADO 1: RESPONSABLES ACTIVOS ====================
  const cargarResponsablesActivos = async () => {
    setLoadingActivos(true);
    try {
      const res = await apiClient.get('/responsables/activos');

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
      console.error('Error al cargar responsables activos:', err);
      message.error('Error al cargar responsables activos');
      setResponsablesActivos([]);
    } finally {
      setLoadingActivos(false);
    }
  };

  const columnasResponsablesActivos = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Nombre Completo', dataIndex: 'NombreResponsable', width: 250 },
    { title: 'Tipo', dataIndex: 'TipoResponsable', width: 120 },
    { title: 'DPI', dataIndex: 'DPI', width: 150, render: (text) => text || '-' },
    { title: 'NIT', dataIndex: 'NIT', width: 120, render: (text) => text || '-' },
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
      'Tipo': r.TipoResponsable,
      'DPI': r.DPI || '-',
      'NIT': r.NIT || '-',
      'Cantidad Hijos': r.CantidadHijos,
      'Nombres de Hijos': r.NombresHijos || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A8' });

    const wscols = [
      { wch: 6 }, { wch: 15 }, { wch: 35 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 60 }
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
  const cargarFamiliasCompletas = async () => {
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
      console.error('Error al cargar familias:', err);
      message.error('Error al cargar familias completas');
      setFamiliasCompletas([]);
    } finally {
      setLoadingFamilias(false);
    }
  };

  const columnasFamilias = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Nombre Familia', dataIndex: 'NombreFamilia', width: 200 },
    {
      title: 'Responsable 1',
      width: 250,
      render: (_, record) => {
        const nombre = record.Responsable1Nombre;
        const tipo = record.Responsable1Tipo;
        return nombre ? `${nombre} (${tipo})` : '-';
      }
    },
    {
      title: 'Responsable 2',
      width: 250,
      render: (_, record) => {
        const nombre = record.Responsable2Nombre;
        const tipo = record.Responsable2Tipo;
        return nombre ? `${nombre} (${tipo})` : '-';
      }
    },
    {
      title: 'Responsable 3',
      width: 250,
      render: (_, record) => {
        const nombre = record.Responsable3Nombre;
        const tipo = record.Responsable3Tipo;
        return nombre ? `${nombre} (${tipo})` : '-';
      }
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

  const exportarFamiliasCompletas = async () => {
    if (familiasCompletas.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Listado de Familias Completas');

    const filas = familiasCompletas.map((f, i) => ({
      '#': i + 1,
      'Nombre Familia': f.NombreFamilia,
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
      { wch: 6 }, { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 18 },
      { wch: 30 }, { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 80 }
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
      const params = new URLSearchParams({
        p_CicloEscolar: filtros.p_CicloEscolar,
        IdGrado: filtros.IdGrado,
      });

      if (filtros.IdSeccion) params.append('IdSeccion', filtros.IdSeccion);
      if (filtros.IdJornada) params.append('IdJornada', filtros.IdJornada);

      const res = await apiClient.get('/responsables/por-grado', { params });

      if (res.data.success && res.data.data) {
        // El primer elemento del array contiene los datos reales con índices numéricos
        // El segundo elemento contiene metadatos de MySQL que debemos ignorar
        const datosReales = res.data.data[0];

        // Extraer solo los objetos que tienen datos (ignorar metadatos)
        const responsablesLimpios = Object.values(datosReales);

        setResponsablesPorGrado(responsablesLimpios);
        message.success(`${responsablesLimpios.length} registro${responsablesLimpios.length !== 1 ? 's' : ''} encontrado${responsablesLimpios.length !== 1 ? 's' : ''}`);
      } else {
        setResponsablesPorGrado([]);
        message.info('No se encontraron responsables con esos filtros');
      }
    } catch (err) {
      console.error('Error al buscar por grado:', err);
      message.error('Error al buscar responsables por grado');
      setResponsablesPorGrado([]);
    } finally {
      setLoadingPorGrado(false);
    }
  };

  const columnasResponsablesPorGrado = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Responsable', dataIndex: 'NombreResponsable', width: 250 },
    { title: 'Tipo', dataIndex: 'TipoResponsable', width: 120 },
    { title: 'DPI', dataIndex: 'DPI', width: 150, render: (text) => text || '-' },
    { title: 'NIT', dataIndex: 'NIT', width: 120, render: (text) => text || '-' },
    { title: 'Carnet Hijo', dataIndex: 'IdAlumno', width: 120 },
    { title: 'Nombre Hijo', dataIndex: 'NombreHijo', width: 250 },
    { title: 'Grado', dataIndex: 'Grado', width: 180 },
    { title: 'Sección', dataIndex: 'Seccion', width: 100 },
    { title: 'Jornada', dataIndex: 'Jornada', width: 120 },
    { title: 'Familia', dataIndex: 'NombreFamilia', width: 200 },
  ];

  const exportarResponsablesPorGrado = async () => {
    if (responsablesPorGrado.length === 0) {
      return message.info('No hay datos para exportar');
    }

    // Registrar en bitácora
    await registrarDescargaExcel('Listado de Responsables por Grado');

    const grado = catalogos.grados.find(g => g.IdGrado === filtros.IdGrado)?.NombreGrado || 'Todos';
    const seccion = catalogos.secciones.find(s => s.IdSeccion === filtros.IdSeccion)?.NombreSeccion || 'Todas';
    const jornada = catalogos.jornadas.find(j => j.IdJornada === filtros.IdJornada)?.NombreJornada || 'Todas';

    const filas = responsablesPorGrado.map((r, i) => ({
      '#': i + 1,
      'Responsable': r.NombreResponsable,
      'Tipo': r.TipoResponsable,
      'DPI': r.DPI || '-',
      'NIT': r.NIT || '-',
      'Carnet Hijo': r.IdAlumno,
      'Nombre Hijo': r.NombreHijo,
      'Grado': r.Grado,
      'Sección': r.Seccion,
      'Jornada': r.Jornada,
      'Familia': r.NombreFamilia
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A10' });

    const wscols = [
      { wch: 6 }, { wch: 35 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
      { wch: 15 }, { wch: 35 }, { wch: 22 }, { wch: 12 }, { wch: 15 }, { wch: 25 }
    ];
    ws['!cols'] = wscols;

    XLSX.utils.sheet_add_aoa(ws, [['LISTADO DE RESPONSABLES POR GRADO']], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    XLSX.utils.sheet_add_aoa(ws, [[`Ciclo: ${filtros.p_CicloEscolar} | Grado: ${grado} | Sección: ${seccion} | Jornada: ${jornada}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 12, italic: true }, alignment: { horizontal: 'center' } };

    const hoy = new Date().toLocaleDateString('es-GT');
    XLSX.utils.sheet_add_aoa(ws, [[`Generado el: ${hoy}`]], { origin: 'A4' });
    ws['A4'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    XLSX.utils.book_append_sheet(wb, ws, 'Responsables por Grado');
    const filename = `Responsables_Grado_${grado.replace(/ /g, '_')}_${hoy.replace(/\//g, '-')}.xlsx`;
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
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportarResponsablesActivos}
                disabled={responsablesActivos.length === 0}
              >
                Exportar Excel
              </Button>
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
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportarFamiliasCompletas}
                disabled={familiasCompletas.length === 0}
              >
                Exportar Excel
              </Button>
            }
          >
            <Table
              columns={columnasFamilias}
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
                columns={columnasResponsablesPorGrado}
                dataSource={responsablesPorGrado}
                rowKey={(record) => `${record.IdResponsable}-${record.IdAlumno}`}
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

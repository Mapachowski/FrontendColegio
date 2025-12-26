// src/pages/Dashboard/Alumnos/EstudiantesRetirados.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, message, Typography, Button } from 'antd';
import { DownloadOutlined, RollbackOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import ModalRegresarEstudiante from './components/ModalRegresarEstudiante';
import { registrarDescargaExcel } from '../../../utils/bitacora';

const { Title } = Typography;

const EstudiantesRetirados = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  // CARGAR DATOS AL MONTAR COMPONENTE
  useEffect(() => {
    cargarEstudiantesRetirados();
  }, []);

  // Función para abrir el modal
  const abrirModalRegresar = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setModalVisible(true);
  };

  // Función para cerrar el modal
  const cerrarModal = () => {
    setModalVisible(false);
    setEstudianteSeleccionado(null);
  };

  // Callback cuando se regresa exitosamente un estudiante
  const handleSuccessRegresar = () => {
    cargarEstudiantesRetirados();
  };

  const cargarEstudiantesRetirados = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/alumnos/alumnos-expulsados');

      // Verificar diferentes estructuras posibles de respuesta
      let datosRetirados = null;

      if (Array.isArray(res.data)) {
        datosRetirados = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        datosRetirados = res.data.data;
      } else if (res.data && res.data.success && Array.isArray(res.data.data)) {
        datosRetirados = res.data.data;
      } else if (res.data && res.data.success && typeof res.data.data === 'object' && res.data.data !== null) {
        // La API devuelve un objeto único, no un array - lo convertimos a array
        datosRetirados = [res.data.data];
      }

      if (datosRetirados && datosRetirados.length > 0) {

        // Ordenar por: Grado, Seccion, Jornada, Apellidos, Nombres
        const datosOrdenados = datosRetirados.sort((a, b) => {
          // Primero por Grado
          const gradoCompare = (a.Grado || '').localeCompare(b.Grado || '');
          if (gradoCompare !== 0) return gradoCompare;

          // Luego por Sección
          const seccionCompare = (a.Seccion || '').localeCompare(b.Seccion || '');
          if (seccionCompare !== 0) return seccionCompare;

          // Luego por Jornada
          const jornadaCompare = (a.Jornada || '').localeCompare(b.Jornada || '');
          if (jornadaCompare !== 0) return jornadaCompare;

          // Luego por Apellidos
          const apellidoCompare = (a.Apellidos || '').localeCompare(b.Apellidos || '');
          if (apellidoCompare !== 0) return apellidoCompare;

          // Finalmente por Nombres
          return (a.Nombres || '').localeCompare(b.Nombres || '');
        });

        setData(datosOrdenados);
        message.success(`${datosOrdenados.length} estudiante${datosOrdenados.length !== 1 ? 's' : ''} retirado${datosOrdenados.length !== 1 ? 's' : ''} encontrado${datosOrdenados.length !== 1 ? 's' : ''}`);
      } else {
        setData([]);
        message.info('No hay estudiantes retirados');
      }
    } catch (err) {
      console.error('Error al cargar estudiantes retirados:', err);
      message.error('Error al cargar los datos de estudiantes retirados');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // EXPORTAR A EXCEL
  const exportarExcel = async () => {
    if (data.length === 0) return message.info('No hay datos para exportar');

    // Registrar en bitácora
    await registrarDescargaExcel('Listado de Estudiantes Retirados');

    // Datos limpios para la tabla
    const filas = data.map((a, i) => ({
      '#': i + 1,
      'Carnet': a.IdAlumno,
      'Código MINEDUC': a.Matricula || '-',
      'Nombres': a.Nombres,
      'Apellidos': a.Apellidos,
      'Grado': a.Grado,
      'Sección': a.Seccion,
      'Jornada': a.Jornada,
      'Comentario': a.ComentarioEstado || '-',
    }));

    // Crear libro y hoja
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas, { origin: 'A8' });

    // Anchos de columna
    const wscols = [
      { wch: 6 }, { wch: 14 }, { wch: 18 }, { wch: 22 },
      { wch: 25 }, { wch: 22 }, { wch: 12 }, { wch: 15 },
      { wch: 40 }
    ];
    ws['!cols'] = wscols;

    // Título grande
    XLSX.utils.sheet_add_aoa(ws, [['LISTADO DE ESTUDIANTES RETIRADOS']], { origin: 'A1' });
    ws['A1'].s = { font: { name: 'Arial', sz: 18, bold: true }, alignment: { horizontal: 'center' } };

    // Fecha de generación
    const hoy = new Date().toLocaleDateString('es-GT');
    XLSX.utils.sheet_add_aoa(ws, [[`Generado el: ${hoy}`]], { origin: 'A3' });
    ws['A3'].s = { font: { name: 'Arial', sz: 10 }, alignment: { horizontal: 'center' } };

    // Encabezados con estilo
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "8";
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "DC2626" } },
        alignment: { horizontal: 'center' }
      };
    }

    // Bordes a toda la tabla
    const dataRange = XLSX.utils.decode_range('A8:I' + (8 + filas.length - 1));
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

    // Añadir hoja al libro y descargar
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes Retirados');
    const filename = `Estudiantes_Retirados_${hoy.replace(/\//g, '-')}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    saveAs(new Blob([excelBuffer]), filename);
    message.success('Excel generado correctamente');
  };

  // COLUMNAS DE LA TABLA
  const columns = [
    { title: '#', render: (_, __, i) => i + 1, width: 60, fixed: 'left' },
    { title: 'Carnet', dataIndex: 'IdAlumno', width: 110 },
    { title: 'Código MINEDUC', dataIndex: 'Matricula', width: 150 },
    { title: 'Nombres', dataIndex: 'Nombres', width: 200 },
    { title: 'Apellidos', dataIndex: 'Apellidos', width: 200 },
    { title: 'Grado', dataIndex: 'Grado', width: 180 },
    { title: 'Sección', dataIndex: 'Seccion', width: 100 },
    { title: 'Jornada', dataIndex: 'Jornada', width: 120 },
    {
      title: 'Comentario Estado',
      dataIndex: 'ComentarioEstado',
      width: 300,
      render: (text) => text || '-'
    },
    {
      title: 'Regresar al sistema',
      width: 180,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<RollbackOutlined />}
          onClick={() => abrirModalRegresar(record)}
          size="small"
        >
          Regresar
        </Button>
      )
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Estudiantes Retirados</Title>
      <Title level={5} type="secondary">Reporte de estudiantes dados de baja del sistema</Title>

      <Card
        title={
          <strong>
            {loading ? 'Cargando...' : `${data.length} estudiante${data.length !== 1 ? 's' : ''} retirado${data.length !== 1 ? 's' : ''}`}
          </strong>
        }
        extra={
          data.length > 0 && (
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportarExcel} size="large">
              Exportar Excel
            </Button>
          )
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="IdAlumno"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100', '200'],
            showTotal: (total) => `Total: ${total} estudiantes`
          }}
          scroll={{ x: 1600 }}
          bordered
          size="middle"
        />
      </Card>

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

      {/* MODAL PARA REGRESAR ESTUDIANTE */}
      <ModalRegresarEstudiante
        visible={modalVisible}
        estudiante={estudianteSeleccionado}
        onCancel={cerrarModal}
        onSuccess={handleSuccessRegresar}
      />
    </div>
  );
};

export default EstudiantesRetirados;

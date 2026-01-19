import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Typography, Space, Tag } from 'antd';
import { DownloadOutlined, FileTextOutlined, FilePdfOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Title, Text } = Typography;

const BoletaCalificacionesFamilia = () => {
  const [hijos, setHijos] = useState([]);
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null);
  const [calificaciones, setCalificaciones] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCalificaciones, setLoadingCalificaciones] = useState(false);

  // Cargar hijos al montar el componente
  useEffect(() => {
    cargarHijos();
  }, []);

  const cargarHijos = async () => {
    setLoading(true);
    try {
      // Obtener el perfil del usuario para obtener IdFamilia
      const perfilResponse = await apiClient.get('/login/perfil');
      const IdFamilia = perfilResponse.data.data.IdFamilia;

      if (!IdFamilia) {
        message.error('No se pudo obtener la información de la familia');
        return;
      }

      // Obtener hijos de la familia
      const cicloActual = getCicloActual();
      const response = await apiClient.get(`/familias/hijosporfamilia/${IdFamilia}`, {
        params: { cicloEscolar: cicloActual }
      });

      if (response.data.success) {
        setHijos(response.data.data || []);
        if (response.data.data.length === 0) {
          message.info('No se encontraron hijos inscritos en el ciclo actual');
        }
      } else {
        message.error('Error al cargar los hijos');
      }
    } catch (error) {
      console.error('Error al cargar hijos:', error);
      message.error('Error al cargar la información de los hijos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCalificaciones = async (hijo) => {
    setLoadingCalificaciones(true);
    setHijoSeleccionado(hijo);
    try {
      const { IdAlumno, CicloEscolar, IdGrado, IdSeccion, IdJornada } = hijo;

      const response = await apiClient.get(`/boleta-calificaciones/calificaciones/${IdAlumno}`, {
        params: {
          cicloEscolar: CicloEscolar,
          idGrado: IdGrado,
          idSeccion: IdSeccion,
          idJornada: IdJornada
        }
      });

      if (response.data.success) {
        const calificacionesData = response.data.data;

        // Validar que tenga la estructura esperada (backend devuelve 'estudiante', no 'alumno')
        if (!calificacionesData.estudiante) {
          console.error('⚠️ ADVERTENCIA: No se encontró el objeto estudiante en la respuesta');
          console.error('Estructura recibida:', calificacionesData);
          message.warning('Las calificaciones se cargaron pero falta información del estudiante');
        }

        setCalificaciones(calificacionesData);
        message.success('Calificaciones cargadas correctamente');
      } else {
        message.error('Error al cargar las calificaciones');
      }
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
      message.error('Error al cargar las calificaciones del estudiante');
    } finally {
      setLoadingCalificaciones(false);
    }
  };

  const generarPDFBoleta = async (dataBoleta) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;

      // Encabezado del colegio
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BOLETA DE CALIFICACIONES', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ciclo Escolar ${dataBoleta.estudiante.CicloEscolar}`, pageWidth / 2, 27, { align: 'center' });

      // Información del estudiante (centrada y organizada)
      let yPosition = 40;

      // Nombre completo del estudiante (centrado)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const nombreCompleto = `${dataBoleta.estudiante.Nombres} ${dataBoleta.estudiante.Apellidos}`;
      doc.text(nombreCompleto, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Código y Grado (en la misma línea, centrados)
      const codigoGrado = `Código: ${dataBoleta.estudiante.Codigo}`;
      const gradoTexto = `Grado: ${dataBoleta.estudiante.NombreGrado} ${dataBoleta.estudiante.NombreSeccion}`;
      doc.text(codigoGrado, margin, yPosition);
      doc.text(gradoTexto, pageWidth - margin, yPosition, { align: 'right' });

      yPosition += 6;
      // Jornada (centrada)
      doc.text(`Jornada: ${dataBoleta.estudiante.NombreJornada}`, pageWidth / 2, yPosition, { align: 'center' });

      // Tabla de calificaciones
      yPosition += 12;

      const tableData = dataBoleta.cursos.map((curso) => {
        const unidades = [1, 2, 3, 4].map(numUnidad => {
          const unidad = curso.unidades.find(u => u.NumeroUnidad === numUnidad);

          // Si no existe la unidad o la nota es null/undefined, mostrar guión
          if (!unidad || unidad.NotaFinal === null || unidad.NotaFinal === undefined) {
            return '-';
          }

          // Si la nota es 0 o mayor, mostrarla (0 es válido)
          return unidad.NotaFinal.toString();
        });

        // Promedio: mostrar guión si es null, 0, o vacío
        const promedioMostrar = (curso.promedio === null || curso.promedio === undefined || curso.promedio === '')
          ? '-'
          : curso.promedio.toString();

        return [
          curso.NombreCurso,
          ...unidades,
          promedioMostrar
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Curso', 'U1', 'U2', 'U3', 'U4', 'Prom']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 10
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 80 },
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 18 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'center', cellWidth: 22, fontStyle: 'bold', fillColor: [240, 240, 240] }
        },
        styles: {
          fontSize: 10,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        margin: { left: margin, right: margin }
      });

      // Promedio General
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');

      // Mostrar guión si el promedio general es null o vacío
      const promedioGeneralTexto = (dataBoleta.promedioGeneral === null || dataBoleta.promedioGeneral === undefined || dataBoleta.promedioGeneral === '')
        ? 'PROMEDIO GENERAL: - puntos'
        : `PROMEDIO GENERAL: ${dataBoleta.promedioGeneral} puntos`;

      doc.text(promedioGeneralTexto, pageWidth / 2, finalY, { align: 'center' });

      // Footer
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Sistema de Gestión Académica', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Generado el ${new Date().toLocaleDateString('es-GT')}`, pageWidth / 2, footerY + 4, { align: 'center' });

      return doc;

    } catch (error) {
      console.error('Error en generarPDFBoleta:', error);
      throw error;
    }
  };

  const imprimirBoleta = async (hijo) => {
    try {
      message.loading({ content: 'Generando PDF...', key: 'pdf' });

      const { IdAlumno, CicloEscolar, IdGrado, IdSeccion, IdJornada } = hijo;

      const response = await apiClient.get(
        `/boleta-calificaciones/calificaciones/${IdAlumno}`,
        {
          params: {
            cicloEscolar: CicloEscolar,
            idGrado: IdGrado,
            idSeccion: IdSeccion,
            idJornada: IdJornada
          }
        }
      );

      if (response.data.success) {
        const dataBoleta = response.data.data;
        const doc = await generarPDFBoleta(dataBoleta);

        const fileName = `Boleta_${dataBoleta.estudiante.Codigo}_${dataBoleta.estudiante.Nombres}_${dataBoleta.estudiante.Apellidos}.pdf`;
        doc.save(fileName);

        message.success({ content: 'PDF generado exitosamente', key: 'pdf' });
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      message.error({ content: 'Error al generar el PDF', key: 'pdf' });
    }
  };

  const exportarExcel = () => {
    if (!calificaciones) {
      message.warning('No hay calificaciones para exportar');
      return;
    }

    const { estudiante, cursos, promedioGeneral } = calificaciones;

    // Validar que estudiante exista
    if (!estudiante) {
      message.error('No se encontró información del estudiante');
      console.error('Estructura de calificaciones:', calificaciones);
      return;
    }

    // Crear datos para el Excel
    const datosExcel = [];

    // Encabezado
    datosExcel.push(['BOLETA DE CALIFICACIONES']);
    datosExcel.push([]);
    datosExcel.push(['Estudiante:', `${estudiante.Nombres} ${estudiante.Apellidos}`]);
    datosExcel.push(['Código:', estudiante.Codigo]);
    datosExcel.push(['Grado:', estudiante.NombreGrado]);
    datosExcel.push(['Sección:', estudiante.NombreSeccion]);
    datosExcel.push(['Jornada:', estudiante.NombreJornada]);
    datosExcel.push(['Ciclo Escolar:', estudiante.CicloEscolar]);
    datosExcel.push([]);

    // Tabla de calificaciones
    datosExcel.push(['Curso', 'Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4', 'Promedio']);

    cursos.forEach(curso => {
      const fila = [curso.NombreCurso];
      // Validar las 4 unidades
      [1, 2, 3, 4].forEach(numUnidad => {
        const unidad = curso.unidades.find(u => u.NumeroUnidad === numUnidad);
        fila.push(unidad && unidad.NotaFinal !== null && unidad.NotaFinal !== undefined ? unidad.NotaFinal : '-');
      });
      fila.push(curso.promedio !== null && curso.promedio !== undefined && curso.promedio !== '' ? curso.promedio : '-');
      datosExcel.push(fila);
    });

    datosExcel.push([]);
    const promedioFinal = promedioGeneral !== null && promedioGeneral !== undefined && promedioGeneral !== '' ? promedioGeneral : '-';
    datosExcel.push(['PROMEDIO GENERAL:', '', '', '', '', promedioFinal]);

    // Crear libro y hoja
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datosExcel);

    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 30 }, // Curso
      { wch: 12 }, // Unidad 1
      { wch: 12 }, // Unidad 2
      { wch: 12 }, // Unidad 3
      { wch: 12 }, // Unidad 4
      { wch: 12 }  // Promedio
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Boleta');

    // Descargar archivo
    const filename = `Boleta_${estudiante.Nombres}_${estudiante.Apellidos}_${estudiante.CicloEscolar}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), filename);

    message.success('Excel descargado correctamente');
  };

  // Columnas para la tabla de hijos
  const columnasHijos = [
    {
      title: 'Carnet',
      dataIndex: 'IdAlumno',
      key: 'IdAlumno',
      width: 100,
    },
    {
      title: 'Nombre Completo',
      key: 'nombreCompleto',
      render: (_, record) => `${record.Nombres} ${record.Apellidos}`,
    },
    {
      title: 'Grado',
      dataIndex: 'NombreGrado',
      key: 'NombreGrado',
    },
    {
      title: 'Sección',
      dataIndex: 'NombreSeccion',
      key: 'NombreSeccion',
      width: 100,
      align: 'center',
    },
    {
      title: 'Jornada',
      dataIndex: 'NombreJornada',
      key: 'NombreJornada',
      width: 120,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 250,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => cargarCalificaciones(record)}
            loading={loadingCalificaciones && hijoSeleccionado?.IdAlumno === record.IdAlumno}
          >
            Ver Boleta
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => imprimirBoleta(record)}
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ];

  // Columnas para la tabla de calificaciones
  const columnasCalificaciones = [1, 2, 3, 4].map((numUnidad) => ({
    title: `Unidad ${numUnidad}`,
    key: `unidad${numUnidad}`,
    width: 100,
    align: 'center',
    render: (_, record) => {
      const unidad = record.unidades.find(u => u.NumeroUnidad === numUnidad);

      // Si no existe la unidad o la nota es null/undefined, mostrar guión
      if (!unidad || unidad.NotaFinal === null || unidad.NotaFinal === undefined) {
        return <Tag color="default">-</Tag>;
      }

      const nota = unidad.NotaFinal;
      const color = nota >= 60 ? 'green' : nota > 0 ? 'red' : 'default';
      return <Tag color={color}>{nota}</Tag>;
    },
  }));

  const todasColumnasCalificaciones = [
    {
      title: 'Curso',
      dataIndex: 'NombreCurso',
      key: 'NombreCurso',
      fixed: 'left',
      width: 250,
    },
    ...columnasCalificaciones,
    {
      title: 'Promedio',
      dataIndex: 'promedio',
      key: 'promedio',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (promedio) => {
        // Mostrar guión si el promedio es null, undefined o vacío
        if (promedio === null || promedio === undefined || promedio === '') {
          return <Tag color="default" style={{ fontSize: 14, fontWeight: 'bold' }}>-</Tag>;
        }
        const color = promedio >= 60 ? 'green' : promedio > 0 ? 'red' : 'default';
        return <Tag color={color} style={{ fontSize: 14, fontWeight: 'bold' }}>{promedio}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Boleta de Calificaciones</Title>
      <Text type="secondary">Consulta las calificaciones de tus hijos</Text>

      {/* Tabla de Hijos */}
      <Card
        title="Mis Hijos"
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <Table
          columns={columnasHijos}
          dataSource={hijos}
          rowKey="IdAlumno"
          pagination={false}
          bordered
          locale={{ emptyText: 'No hay hijos inscritos en el ciclo actual' }}
        />
      </Card>

      {/* Tabla de Calificaciones */}
      {calificaciones && calificaciones.estudiante && (
        <Card
          title={
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 18 }}>
                Boleta de Calificaciones - {calificaciones.estudiante.Nombres} {calificaciones.estudiante.Apellidos}
              </Text>
              <Space size="large" style={{ marginTop: 8 }}>
                <Text type="secondary">Grado: {calificaciones.estudiante.NombreGrado}</Text>
                <Text type="secondary">Sección: {calificaciones.estudiante.NombreSeccion}</Text>
                <Text type="secondary">Ciclo: {calificaciones.estudiante.CicloEscolar}</Text>
              </Space>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={() => imprimirBoleta(hijoSeleccionado)}
                size="large"
              >
                Generar PDF
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportarExcel}
                size="large"
              >
                Descargar Excel
              </Button>
            </Space>
          }
          style={{ marginTop: 24 }}
          loading={loadingCalificaciones}
        >
          <Table
            columns={todasColumnasCalificaciones}
            dataSource={calificaciones.cursos}
            rowKey="idCurso"
            pagination={false}
            bordered
            scroll={{ x: 1000 }}
            footer={() => {
              const promedioGeneral = calificaciones.promedioGeneral;
              const promedioTexto = promedioGeneral === null || promedioGeneral === undefined || promedioGeneral === '' ? '-' : promedioGeneral;
              const color = promedioGeneral >= 60 ? 'green' : promedioGeneral > 0 ? 'red' : 'default';

              return (
                <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16 }}>
                  <Space>
                    <Text>PROMEDIO GENERAL:</Text>
                    <Tag
                      color={color}
                      style={{ fontSize: 16, padding: '4px 16px' }}
                    >
                      {promedioTexto}
                    </Tag>
                  </Space>
                </div>
              );
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default BoletaCalificacionesFamilia;

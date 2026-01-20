import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Table, Space, message, Empty, Spin, Modal } from 'antd';
import { FileTextOutlined, PrinterOutlined, EyeOutlined, FilePdfOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { getCicloActual } from '../../../utils/cicloEscolar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Option } = Select;

const BoletaCalificaciones = () => {

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    cicloEscolar: getCicloActual(),
    idGrado: null,
    idSeccion: null,
    idJornada: null
  });

  // Estados para catálogos
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Estados para estudiantes y boletas
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Estado para modal de boleta individual
  const [modalVisible, setModalVisible] = useState(false);
  const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
  const [loadingBoleta, setLoadingBoleta] = useState(false);

  // Cargar catálogos al montar el componente
  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const [gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/grados'),
        apiClient.get('/secciones'),
        apiClient.get('/jornadas')
      ]);

      if (gradosRes.data.success) setGrados(gradosRes.data.data);
      if (seccionesRes.data.success) setSecciones(seccionesRes.data.data);
      if (jornadasRes.data.success) setJornadas(jornadasRes.data.data);
    } catch (error) {
      message.error('Error al cargar los catálogos');
    } finally {
      setLoadingCatalogos(false);
    }
  };

  const cargarEstudiantes = async () => {
    // Validar que todos los filtros estén seleccionados
    if (!filtros.cicloEscolar || !filtros.idGrado || !filtros.idSeccion || !filtros.idJornada) {
      message.warning('Debes seleccionar todos los filtros');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get('/boleta-calificaciones/estudiantes', {
        params: filtros
      });

      if (response.data.success) {
        setEstudiantes(response.data.data || []);
        if (response.data.data.length === 0) {
          message.info('No se encontraron estudiantes con los filtros seleccionados');
        }
      }
    } catch (error) {
      message.error('Error al cargar los estudiantes');
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  const verBoleta = async (idAlumno) => {
    setLoadingBoleta(true);
    setModalVisible(true);
    setBoletaSeleccionada(null);

    try {
      const response = await apiClient.get(
        `/boleta-calificaciones/calificaciones/${idAlumno}`,
        { params: filtros }
      );

      if (response.data.success) {
        setBoletaSeleccionada(response.data.data);
      }
    } catch (error) {
      message.error('Error al cargar la boleta');
      setModalVisible(false);
    } finally {
      setLoadingBoleta(false);
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


      const tableData = dataBoleta.cursos.map((curso, index) => {

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
      throw error;
    }
  };

  const imprimirBoleta = async (idAlumno) => {
    try {
      message.loading({ content: 'Generando PDF...', key: 'pdf' });

      const response = await apiClient.get(
        `/boleta-calificaciones/calificaciones/${idAlumno}`,
        { params: filtros }
      );

      if (response.data.success) {
        const dataBoleta = response.data.data;

        const doc = await generarPDFBoleta(dataBoleta);

        const fileName = `Boleta_${dataBoleta.estudiante.Codigo}_${dataBoleta.estudiante.Nombres}_${dataBoleta.estudiante.Apellidos}.pdf`;
        doc.save(fileName);

        message.success({ content: 'PDF generado exitosamente', key: 'pdf' });
      } else {
      }
    } catch (error) {
      message.error({ content: 'Error al generar el PDF', key: 'pdf' });
    }
  };

  const imprimirTodasLasBoletas = async () => {
    if (estudiantes.length === 0) {
      message.warning('No hay estudiantes para imprimir');
      return;
    }

    try {
      message.loading({ content: `Generando PDF con ${estudiantes.length} boletas...`, key: 'pdfMasivo' });

      // Obtener todas las boletas en lote
      const idsAlumnos = estudiantes.map(est => est.IdAlumno);

      const payload = {
        cicloEscolar: filtros.cicloEscolar,
        idGrado: filtros.idGrado,
        idSeccion: filtros.idSeccion,
        idJornada: filtros.idJornada,
        estudiantes: idsAlumnos
      };

      // 🔍 DEBUG: Ver qué estamos enviando

      const response = await apiClient.post('/boleta-calificaciones/lote', payload);

      if (response.data.success) {
        const boletas = response.data.data;

        // 🔍 DEBUG: Ver estructura de datos del backend

        if (!boletas || boletas.length === 0) {
          message.warning('No se recibieron boletas del backend');
          return;
        }

        const doc = new jsPDF();

        // Generar 2 boletas por página
        for (let i = 0; i < boletas.length; i++) {
          const dataBoleta = boletas[i];
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          const margin = 10;
          const boletaHeight = (pageHeight - margin * 3) / 2;

          // Determinar si es la primera o segunda boleta de la página
          const isPrimera = i % 2 === 0;
          const yOffset = isPrimera ? margin : (pageHeight / 2 + margin / 2);

          // Si es la segunda boleta de la página (y no es la primera iteración), no agregar nueva página aún
          // Si es la primera boleta y no es la primera iteración, agregar nueva página
          if (i > 0 && isPrimera) {
            doc.addPage();
          }

          // Encabezado
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('BOLETA DE CALIFICACIONES', pageWidth / 2, yOffset + 8, { align: 'center' });

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Ciclo Escolar ${dataBoleta.estudiante.CicloEscolar}`, pageWidth / 2, yOffset + 13, { align: 'center' });

          // Información del estudiante
          let yPos = yOffset + 20;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text(`${dataBoleta.estudiante.Nombres} ${dataBoleta.estudiante.Apellidos}`, margin, yPos);

          yPos += 4;
          doc.setFont('helvetica', 'normal');
          doc.text(`Código: ${dataBoleta.estudiante.Codigo}`, margin, yPos);
          doc.text(`Grado: ${dataBoleta.estudiante.NombreGrado} ${dataBoleta.estudiante.NombreSeccion}`, pageWidth / 2, yPos);

          yPos += 6;

          // Tabla de calificaciones
          const tableData = dataBoleta.cursos.map(curso => {
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
            startY: yPos,
            head: [['Curso', 'U1', 'U2', 'U3', 'U4', 'Prom']],
            body: tableData,
            theme: 'grid',
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 7
            },
            columnStyles: {
              0: { halign: 'left', cellWidth: 60 },
              1: { halign: 'center', cellWidth: 15 },
              2: { halign: 'center', cellWidth: 15 },
              3: { halign: 'center', cellWidth: 15 },
              4: { halign: 'center', cellWidth: 15 },
              5: { halign: 'center', cellWidth: 18, fontStyle: 'bold' }
            },
            styles: {
              fontSize: 7,
              cellPadding: 2
            },
            margin: { left: margin, right: margin },
            tableWidth: pageWidth - margin * 2
          });

          // Promedio General
          const finalY = doc.lastAutoTable.finalY + 4;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');

          // Mostrar guión si el promedio general es null o vacío
          const promedioGeneralTexto = (dataBoleta.promedioGeneral === null || dataBoleta.promedioGeneral === undefined || dataBoleta.promedioGeneral === '')
            ? 'PROMEDIO GENERAL: - puntos'
            : `PROMEDIO GENERAL: ${dataBoleta.promedioGeneral} puntos`;

          doc.text(promedioGeneralTexto, pageWidth / 2, finalY, { align: 'center' });

          // Línea separadora si es la primera boleta
          if (isPrimera && i < boletas.length - 1) {
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight / 2, pageWidth - margin, pageHeight / 2);
          }
        }

        // Footer en la última página
        const footerY = doc.internal.pageSize.height - 10;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text(`Generado el ${new Date().toLocaleDateString('es-GT')}`, doc.internal.pageSize.width / 2, footerY, { align: 'center' });

        const fileName = `Boletas_${filtros.cicloEscolar}_Grado${filtros.idGrado}_Seccion${filtros.idSeccion}.pdf`;
        doc.save(fileName);

        message.success({ content: `PDF generado con ${boletas.length} boletas`, key: 'pdfMasivo' });
      }
    } catch (error) {
      message.error({ content: 'Error al generar el PDF masivo', key: 'pdfMasivo' });
    }
  };

  const columnasEstudiantes = [
    {
      title: 'Código',
      dataIndex: 'Codigo',
      key: 'Codigo',
      width: 120
    },
    {
      title: 'Nombre Completo',
      key: 'nombreCompleto',
      render: (_, record) => `${record.Nombres} ${record.Apellidos}`
    },
    {
      title: 'Grado',
      dataIndex: 'NombreGrado',
      key: 'NombreGrado',
      width: 150
    },
    {
      title: 'Sección',
      dataIndex: 'NombreSeccion',
      key: 'NombreSeccion',
      width: 100,
      align: 'center'
    },
    {
      title: 'Jornada',
      dataIndex: 'NombreJornada',
      key: 'NombreJornada',
      width: 120
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => verBoleta(record.IdAlumno)}
          >
            Ver
          </Button>
          <Button
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => imprimirBoleta(record.IdAlumno)}
          >
            PDF
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <FileTextOutlined /> Boleta de Calificaciones
          </span>
        }
      >
        {/* Filtros */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Año Escolar
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Seleccionar año"
              value={filtros.cicloEscolar}
              onChange={(value) => setFiltros(prev => ({ ...prev, cicloEscolar: value }))}
            >
              <Option value="2024">2024</Option>
              <Option value="2025">2025</Option>
              <Option value="2026">2026</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Grado
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Seleccionar grado"
              value={filtros.idGrado}
              onChange={(value) => setFiltros(prev => ({ ...prev, idGrado: value }))}
              loading={loadingCatalogos}
              disabled={loadingCatalogos}
            >
              {grados.map(grado => (
                <Option key={grado.IdGrado} value={grado.IdGrado}>
                  {grado.NombreGrado}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Sección
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Seleccionar sección"
              value={filtros.idSeccion}
              onChange={(value) => setFiltros(prev => ({ ...prev, idSeccion: value }))}
              loading={loadingCatalogos}
              disabled={loadingCatalogos}
            >
              {secciones.map(seccion => (
                <Option key={seccion.IdSeccion} value={seccion.IdSeccion}>
                  {seccion.NombreSeccion}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Jornada
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Seleccionar jornada"
              value={filtros.idJornada}
              onChange={(value) => setFiltros(prev => ({ ...prev, idJornada: value }))}
              loading={loadingCatalogos}
              disabled={loadingCatalogos}
            >
              {jornadas.map(jornada => (
                <Option key={jornada.IdJornada} value={jornada.IdJornada}>
                  {jornada.NombreJornada}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Botones de acción */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Space>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={cargarEstudiantes}
                loading={loading}
              >
                Buscar Estudiantes
              </Button>

              <Button
                icon={<PrinterOutlined />}
                onClick={imprimirTodasLasBoletas}
                disabled={estudiantes.length === 0}
              >
                Imprimir Todas las Boletas ({estudiantes.length})
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Tabla de estudiantes */}
        <Table
          columns={columnasEstudiantes}
          dataSource={estudiantes}
          rowKey="IdAlumno"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} estudiantes`
          }}
          locale={{
            emptyText: (
              <Empty
                description="Selecciona los filtros y haz clic en 'Buscar Estudiantes'"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal para ver boleta */}
      <Modal
        title={
          <span>
            <FileTextOutlined /> Boleta de Calificaciones
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        {loadingBoleta ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>Cargando boleta...</p>
          </div>
        ) : boletaSeleccionada ? (
          <div>
            {/* Información del estudiante */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <strong>Estudiante:</strong> {boletaSeleccionada.estudiante.Nombres} {boletaSeleccionada.estudiante.Apellidos}
                </Col>
                <Col span={12}>
                  <strong>Código:</strong> {boletaSeleccionada.estudiante.Codigo}
                </Col>
                <Col span={8}>
                  <strong>Grado:</strong> {boletaSeleccionada.estudiante.NombreGrado}
                </Col>
                <Col span={8}>
                  <strong>Sección:</strong> {boletaSeleccionada.estudiante.NombreSeccion}
                </Col>
                <Col span={8}>
                  <strong>Jornada:</strong> {boletaSeleccionada.estudiante.NombreJornada}
                </Col>
              </Row>
            </Card>

            {/* Calificaciones por curso */}
            {boletaSeleccionada.cursos.length > 0 ? (
              <>
                {boletaSeleccionada.cursos.map((curso, index) => (
                  <Card
                    key={index}
                    size="small"
                    title={curso.NombreCurso}
                    style={{ marginBottom: 16 }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #d9d9d9' }}>
                          <th style={{ padding: 8, textAlign: 'center' }}>Unidad 1</th>
                          <th style={{ padding: 8, textAlign: 'center' }}>Unidad 2</th>
                          <th style={{ padding: 8, textAlign: 'center' }}>Unidad 3</th>
                          <th style={{ padding: 8, textAlign: 'center' }}>Unidad 4</th>
                          <th style={{ padding: 8, textAlign: 'center', backgroundColor: '#e6f7ff' }}>
                            <strong>PROMEDIO</strong>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {[1, 2, 3, 4].map(numUnidad => {
                            const unidad = curso.unidades.find(u => u.NumeroUnidad === numUnidad);
                            return (
                              <td key={numUnidad} style={{ padding: 8, textAlign: 'center', border: '1px solid #d9d9d9' }}>
                                {unidad ? unidad.NotaFinal : '-'}
                              </td>
                            );
                          })}
                          <td style={{ padding: 8, textAlign: 'center', border: '1px solid #d9d9d9', backgroundColor: '#e6f7ff' }}>
                            <strong>{curso.promedio}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Card>
                ))}

                {/* Promedio General */}
                <Card
                  size="small"
                  style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
                >
                  <div style={{ textAlign: 'center', fontSize: 16 }}>
                    <strong>PROMEDIO GENERAL: {boletaSeleccionada.promedioGeneral} puntos</strong>
                  </div>
                </Card>

                {/* Botón de imprimir */}
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    icon={<FilePdfOutlined />}
                    onClick={() => imprimirBoleta(boletaSeleccionada.estudiante.IdAlumno)}
                  >
                    Generar PDF
                  </Button>
                </div>
              </>
            ) : (
              <Empty description="Este estudiante no tiene calificaciones registradas" />
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default BoletaCalificaciones;

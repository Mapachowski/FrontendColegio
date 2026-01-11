import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Typography, Space, Tag } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { getCicloActual } from '../../../utils/cicloEscolar';

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

      console.log('=== RESPUESTA CALIFICACIONES ===');
      console.log('Response completa:', response.data);
      console.log('Response.data.data:', response.data.data);
      console.log('==============================');

      if (response.data.success) {
        const calificacionesData = response.data.data;

        // Validar que tenga la estructura esperada
        if (!calificacionesData.alumno) {
          console.error('⚠️ ADVERTENCIA: No se encontró el objeto alumno en la respuesta');
          console.error('Estructura recibida:', calificacionesData);
          message.warning('Las calificaciones se cargaron pero falta información del alumno');
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

  const exportarExcel = () => {
    if (!calificaciones) {
      message.warning('No hay calificaciones para exportar');
      return;
    }

    const { alumno, cursos, promedioGeneral } = calificaciones;

    // Validar que alumno exista
    if (!alumno) {
      message.error('No se encontró información del alumno');
      console.error('Estructura de calificaciones:', calificaciones);
      return;
    }

    // Crear datos para el Excel
    const datosExcel = [];

    // Encabezado
    datosExcel.push(['BOLETA DE CALIFICACIONES']);
    datosExcel.push([]);
    datosExcel.push(['Estudiante:', `${alumno.Nombres} ${alumno.Apellidos}`]);
    datosExcel.push(['Carnet:', alumno.IdAlumno]);
    datosExcel.push(['Grado:', alumno.NombreGrado]);
    datosExcel.push(['Sección:', alumno.NombreSeccion]);
    datosExcel.push(['Jornada:', alumno.NombreJornada]);
    datosExcel.push(['Ciclo Escolar:', alumno.CicloEscolar]);
    datosExcel.push([]);

    // Tabla de calificaciones
    datosExcel.push(['Curso', 'Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4', 'Promedio']);

    cursos.forEach(curso => {
      const fila = [curso.NombreCurso];
      curso.unidades.forEach(unidad => {
        fila.push(unidad.NotaFinal);
      });
      fila.push(curso.promedio);
      datosExcel.push(fila);
    });

    datosExcel.push([]);
    datosExcel.push(['PROMEDIO GENERAL:', '', '', '', '', promedioGeneral]);

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
    const filename = `Boleta_${alumno.Nombres}_${alumno.Apellidos}_${alumno.CicloEscolar}.xlsx`;
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
      title: 'Acción',
      key: 'accion',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={() => cargarCalificaciones(record)}
          loading={loadingCalificaciones && hijoSeleccionado?.IdAlumno === record.IdAlumno}
        >
          Ver Boleta
        </Button>
      ),
    },
  ];

  // Columnas para la tabla de calificaciones
  const columnasCalificaciones = calificaciones?.cursos[0]?.unidades.map((_, index) => ({
    title: `Unidad ${index + 1}`,
    key: `unidad${index + 1}`,
    width: 100,
    align: 'center',
    render: (_, record) => {
      const nota = record.unidades[index]?.NotaFinal || 0;
      const color = nota >= 60 ? 'green' : nota > 0 ? 'red' : 'default';
      return <Tag color={color}>{nota}</Tag>;
    },
  })) || [];

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
      {calificaciones && calificaciones.alumno && (
        <Card
          title={
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 18 }}>
                Boleta de Calificaciones - {calificaciones.alumno.Nombres} {calificaciones.alumno.Apellidos}
              </Text>
              <Space size="large" style={{ marginTop: 8 }}>
                <Text type="secondary">Grado: {calificaciones.alumno.NombreGrado}</Text>
                <Text type="secondary">Sección: {calificaciones.alumno.NombreSeccion}</Text>
                <Text type="secondary">Ciclo: {calificaciones.alumno.CicloEscolar}</Text>
              </Space>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportarExcel}
              size="large"
            >
              Descargar Excel
            </Button>
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
            footer={() => (
              <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16 }}>
                <Space>
                  <Text>PROMEDIO GENERAL:</Text>
                  <Tag
                    color={calificaciones.promedioGeneral >= 60 ? 'green' : 'red'}
                    style={{ fontSize: 16, padding: '4px 16px' }}
                  >
                    {calificaciones.promedioGeneral}
                  </Tag>
                </Space>
              </div>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default BoletaCalificacionesFamilia;

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Select, message, Tag, Card, Row, Col } from 'antd';
import { PlusOutlined, SwapOutlined, BookOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import apiClient from '../../../api/apiClient';

const { Option } = Select;

const AsignacionCursos = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState(null);
  const [form] = Form.useForm();
  const [formEditar] = Form.useForm();

  // Catálogos
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  // Filtros
  const obtenerAnioEscolarInicial = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return (month >= 10) ? year + 1 : year;
  };
  const [anioFiltro, setAnioFiltro] = useState(obtenerAnioEscolarInicial());
  const [docenteFiltro, setDocenteFiltro] = useState(null);
  const [gradoFiltro, setGradoFiltro] = useState(null);

  useEffect(() => {
    cargarCatalogos();
    cargarAsignaciones();
  }, [anioFiltro, docenteFiltro, gradoFiltro]);

  const cargarCatalogos = async () => {
    try {
      const [docentesRes, gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/docentes'),
        apiClient.get('/catalogos/grados'),
        apiClient.get('/catalogos/secciones'),
        apiClient.get('/catalogos/jornadas')
      ]);

      if (docentesRes.data.success) setDocentes(docentesRes.data.data);
      if (gradosRes.data.success) setGrados(gradosRes.data.data);
      if (seccionesRes.data.success) setSecciones(seccionesRes.data.data);
      if (jornadasRes.data.success) setJornadas(jornadasRes.data.data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      message.error('Error al cargar catálogos');
    }
  };

  const cargarCursosDisponibles = async () => {
    try {
      const idGrado = form.getFieldValue('idGrado');
      const idSeccion = form.getFieldValue('idSeccion');
      const idJornada = form.getFieldValue('idJornada');
      const Anio = form.getFieldValue('Anio');

      // Solo cargar si tenemos todos los valores necesarios
      if (!idGrado || !idSeccion || !idJornada || !Anio) {
        setCursos([]);
        return;
      }

      const response = await apiClient.get('/catalogos/cursos-disponibles', {
        params: { idGrado, idSeccion, idJornada, Anio }
      });

      if (response.data.success) {
        setCursos(response.data.data);

        // Si no hay cursos disponibles, mostrar mensaje
        if (response.data.data.length === 0) {
          message.info('Todos los cursos de este grado ya han sido asignados para esta sección, jornada y año');
        }
      }
    } catch (error) {
      console.error('Error al cargar cursos disponibles:', error);
      message.error('Error al cargar cursos disponibles');
    }
  };

  const handleComboCambiado = () => {
    // Limpiar curso seleccionado cuando cambia cualquier combo
    form.setFieldsValue({ idCurso: undefined });
    // Recargar cursos disponibles
    cargarCursosDisponibles();
  };

  const cargarAsignaciones = async () => {
    setLoading(true);
    try {
      const params = {};
      if (anioFiltro) params.anio = anioFiltro;
      if (docenteFiltro) params.idDocente = docenteFiltro;

      const response = await apiClient.get('/asignaciones', { params });
      if (response.data.success) {
        let datos = response.data.data;

        // Filtrar por grado si está seleccionado
        if (gradoFiltro) {
          datos = datos.filter(asig => asig.idGrado === gradoFiltro);
        }

        // Ordenar por jornada y luego por curso (asignatura)
        datos.sort((a, b) => {
          const jornadaCompare = (a.jornada?.NombreJornada || '').localeCompare(b.jornada?.NombreJornada || '');
          if (jornadaCompare !== 0) return jornadaCompare;
          return (a.curso?.Curso || '').localeCompare(b.curso?.Curso || '');
        });

        setAsignaciones(datos);
      }
    } catch (error) {
      console.error('Error al cargar asignaciones:', error);
      message.error('Error al cargar la lista de asignaciones');
    } finally {
      setLoading(false);
    }
  };

  const obtenerAnioEscolar = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = enero, 10 = noviembre, 11 = diciembre

    // Si es noviembre (10) o diciembre (11), usar el siguiente año
    return (month >= 10) ? year + 1 : year;
  };

  const abrirModal = () => {
    form.resetFields();
    form.setFieldsValue({ Anio: obtenerAnioEscolar() });
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const abrirModalEditar = (asignacion) => {
    setAsignacionEditando(asignacion);
    formEditar.setFieldsValue({
      idDocente: asignacion.idDocente
    });
    setModalEditarVisible(true);
  };

  const cerrarModalEditar = () => {
    setModalEditarVisible(false);
    setAsignacionEditando(null);
    formEditar.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      console.log('=== INICIO CREAR ASIGNACIÓN ===');
      console.log('Valores del formulario:', values);

      const response = await apiClient.post('/asignaciones', values);

      console.log('=== RESPUESTA DEL SERVIDOR ===');
      console.log('Status:', response.status);
      console.log('Data completo:', JSON.stringify(response.data, null, 2));
      console.log('Success?:', response.data.success);
      console.log('Tipo de success:', typeof response.data.success);

      // Verificar si fue exitoso (puede ser boolean true o string "true" o status 201)
      const exitoso = response.data.success === true ||
                      response.data.success === 'true' ||
                      response.status === 201;

      if (exitoso) {
        console.log('✅ Asignación exitosa, mostrando mensaje...');

        // Mostrar mensaje de éxito (duración: 10 segundos)
        message.success(
          response.data.message || 'Asignación creada exitosamente. Se crearon 4 unidades automáticamente.',
          10
        );

        console.log('Cerrando modal...');
        cerrarModal();

        // Actualizar filtro de año si es diferente
        const anioCreado = values.Anio;
        console.log('Actualizando tabla, año creado:', anioCreado, 'año filtro actual:', anioFiltro);

        if (anioFiltro !== anioCreado) {
          setAnioFiltro(anioCreado);
        } else {
          await cargarAsignaciones();
        }

        console.log('✅ Proceso completado exitosamente');
      } else {
        console.log('❌ Respuesta indica error');
        message.error(response.data.message || 'Error al crear asignación');
      }
    } catch (error) {
      console.error('=== ERROR EN CREAR ASIGNACIÓN ===');
      console.error('Error completo:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);

      message.error(error.response?.data?.message || 'Error al crear asignación');
    }
  };

  const handleActualizar = async (values) => {
    try {
      const response = await apiClient.put(`/asignaciones/${asignacionEditando.idAsignacionDocente}`, values);

      if (response.data.success) {
        message.success(response.data.message || 'Docente actualizado exitosamente', 8);
        cerrarModalEditar();
        await cargarAsignaciones();
      } else {
        message.error(response.data.message || 'Error al actualizar asignación');
      }
    } catch (error) {
      console.error('Error al actualizar asignación:', error);
      message.error(error.response?.data?.message || 'Error al actualizar asignación');
    }
  };

  const exportarAExcel = () => {
    if (asignaciones.length === 0) {
      message.warning('No hay datos para exportar');
      return;
    }

    // Preparar datos para Excel
    const datosExcel = asignaciones.map(asig => ({
      'Año': asig.Anio,
      'Docente': `${asig.docente?.Apellidos || ''} ${asig.docente?.Nombres || ''}`.trim(),
      'Curso': asig.curso?.Curso || '',
      'Grado': asig.grado?.NombreGrado || '',
      'Sección': asig.seccion?.NombreSeccion || '',
      'Jornada': asig.jornada?.NombreJornada || '',
      'Creado Por': asig.CreadoPor || '',
      'Fecha Creado': asig.FechaCreado ? new Date(asig.FechaCreado).toLocaleDateString('es-GT') : ''
    }));

    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignaciones');

    // Generar nombre de archivo
    const nombreArchivo = `Asignaciones_${anioFiltro || 'Todos'}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo);
    message.success('Archivo Excel generado exitosamente');
  };

  const columns = [
    {
      title: 'Año',
      dataIndex: 'Anio',
      key: 'Anio',
      width: 80,
      sorter: (a, b) => a.Anio - b.Anio,
      render: (anio) => <Tag color="blue">{anio}</Tag>
    },
    {
      title: 'Docente',
      key: 'docente',
      render: (_, record) => (
        <span>
          {record.docente?.Nombres} {record.docente?.Apellidos}
        </span>
      ),
      sorter: (a, b) => {
        const nombreA = `${a.docente?.Apellidos} ${a.docente?.Nombres}`;
        const nombreB = `${b.docente?.Apellidos} ${b.docente?.Nombres}`;
        return nombreA.localeCompare(nombreB);
      }
    },
    {
      title: 'Curso',
      dataIndex: ['curso', 'Curso'],
      key: 'curso',
    },
    {
      title: 'Grado',
      dataIndex: ['grado', 'NombreGrado'],
      key: 'grado',
      width: 100,
    },
    {
      title: 'Sección',
      dataIndex: ['seccion', 'NombreSeccion'],
      key: 'seccion',
      width: 100,
    },
    {
      title: 'Jornada',
      dataIndex: ['jornada', 'NombreJornada'],
      key: 'jornada',
      width: 120,
    },
    {
      title: 'Creado Por',
      dataIndex: 'CreadoPor',
      key: 'CreadoPor',
      width: 120,
    },
    {
      title: 'Fecha Creado',
      dataIndex: 'FechaCreado',
      key: 'FechaCreado',
      width: 150,
      render: (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-GT') : '-'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<SwapOutlined />}
          onClick={() => abrirModalEditar(record)}
          title="Cambiar docente"
        >
          Editar
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <span>
            <SwapOutlined /> Asignación de Cursos a Docentes
          </span>
        }
        extra={
          <Space>
            <Button
              type="default"
              icon={<FileExcelOutlined />}
              onClick={exportarAExcel}
            >
              Exportar a Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={abrirModal}
            >
              Nueva Asignación
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={5}>
            <Select
              placeholder="Filtrar por año"
              style={{ width: '100%' }}
              value={anioFiltro}
              onChange={setAnioFiltro}
            >
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
              <Option value={2026}>2026</Option>
              <Option value={2027}>2027</Option>
            </Select>
          </Col>
          <Col span={7}>
            <Select
              placeholder="Filtrar por grado (opcional)"
              style={{ width: '100%' }}
              value={gradoFiltro}
              onChange={setGradoFiltro}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {grados.map(grado => (
                <Option key={grado.IdGrado} value={grado.IdGrado}>
                  {grado.NombreGrado}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="Filtrar por docente (opcional)"
              style={{ width: '100%' }}
              value={docenteFiltro}
              onChange={setDocenteFiltro}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {docentes.map(doc => (
                <Option key={doc.idDocente} value={doc.idDocente}>
                  {doc.Apellidos} {doc.Nombres}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={asignaciones}
          rowKey="idAsignacionDocente"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} asignaciones`,
          }}
          bordered
          size="small"
        />
      </Card>

      <Modal
        title={
          <span>
            <BookOutlined /> Nueva Asignación de Curso
          </span>
        }
        open={modalVisible}
        onCancel={cerrarModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="Anio"
            label="1. Año Escolar"
            rules={[{ required: true, message: 'Por favor seleccione el año' }]}
          >
            <Select placeholder="Seleccione el año" onChange={handleComboCambiado}>
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
              <Option value={2026}>2026</Option>
              <Option value={2027}>2027</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="idGrado"
            label="2. Grado"
            rules={[{ required: true, message: 'Por favor seleccione el grado' }]}
          >
            <Select
              placeholder="Seleccione el grado"
              onChange={handleComboCambiado}
            >
              {grados.map(grado => (
                <Option key={grado.IdGrado} value={grado.IdGrado}>
                  {grado.NombreGrado}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="idSeccion"
            label="3. Sección"
            rules={[{ required: true, message: 'Por favor seleccione la sección' }]}
          >
            <Select placeholder="Seleccione la sección" onChange={handleComboCambiado}>
              {secciones.map(seccion => (
                <Option key={seccion.IdSeccion} value={seccion.IdSeccion}>
                  {seccion.NombreSeccion}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="idJornada"
            label="4. Jornada"
            rules={[{ required: true, message: 'Por favor seleccione la jornada' }]}
          >
            <Select placeholder="Seleccione la jornada" onChange={handleComboCambiado}>
              {jornadas.map(jornada => (
                <Option key={jornada.IdJornada} value={jornada.IdJornada}>
                  {jornada.NombreJornada}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="idDocente"
            label="5. Docente"
            rules={[{ required: true, message: 'Por favor seleccione el docente' }]}
          >
            <Select
              placeholder="Seleccione el docente"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {docentes.map(doc => (
                <Option key={doc.idDocente} value={doc.idDocente}>
                  {doc.Apellidos} {doc.Nombres}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="idCurso"
            label="6. Curso (solo disponibles)"
            rules={[{ required: true, message: 'Por favor seleccione el curso' }]}
          >
            <Select
              placeholder={cursos.length > 0 ? "Seleccione el curso" : "Primero complete los campos anteriores"}
              showSearch
              optionFilterProp="children"
              disabled={cursos.length === 0}
            >
              {cursos.map(curso => (
                <Option key={curso.idCurso} value={curso.idCurso}>
                  {curso.Curso}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{
            background: '#e6f7ff',
            border: '1px solid #91d5ff',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <strong>Nota:</strong> Solo se muestran los cursos disponibles (no asignados) para la combinación seleccionada de grado, sección, jornada y año. Al crear la asignación, se crearán automáticamente 4 unidades.
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Crear Asignación
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para Editar Docente */}
      <Modal
        title={
          <span>
            <SwapOutlined /> Cambiar Docente de Asignación
          </span>
        }
        open={modalEditarVisible}
        onCancel={cerrarModalEditar}
        footer={null}
        width={500}
      >
        {asignacionEditando && (
          <>
            <div style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              <p><strong>Curso:</strong> {asignacionEditando.curso?.Curso}</p>
              <p><strong>Grado:</strong> {asignacionEditando.grado?.NombreGrado}</p>
              <p><strong>Sección:</strong> {asignacionEditando.seccion?.NombreSeccion}</p>
              <p><strong>Jornada:</strong> {asignacionEditando.jornada?.NombreJornada}</p>
              <p style={{ marginBottom: 0 }}><strong>Año:</strong> {asignacionEditando.Anio}</p>
            </div>

            <Form
              form={formEditar}
              layout="vertical"
              onFinish={handleActualizar}
            >
              <Form.Item
                name="idDocente"
                label="Nuevo Docente"
                rules={[{ required: true, message: 'Por favor seleccione el docente' }]}
              >
                <Select
                  placeholder="Seleccione el nuevo docente"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {docentes.map(doc => (
                    <Option key={doc.idDocente} value={doc.idDocente}>
                      {doc.Apellidos} {doc.Nombres}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <strong>Nota:</strong> Solo se cambiará el docente. El curso, grado, sección, jornada y año permanecerán igual. Las unidades y actividades ya creadas se mantendrán.
              </div>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={cerrarModalEditar}>
                    Cancelar
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Actualizar Docente
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AsignacionCursos;

import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, Space, message, Alert, Spin } from 'antd';
import { BookOutlined, WarningOutlined } from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';
import { getCicloActual } from '../../../../../utils/cicloEscolar';

const { Option } = Select;

const CrearAsignacionModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validando, setValidando] = useState(false);
  const [duplicado, setDuplicado] = useState(null);

  // Catálogos
  const [docentes, setDocentes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  useEffect(() => {
    if (visible) {
      cargarCatalogos();
      const anioActual = getCicloActual();
      form.setFieldsValue({ Anio: anioActual });
    } else {
      form.resetFields();
      setCursos([]);
      setDuplicado(null);
    }
  }, [visible]);

  const cargarCatalogos = async () => {
    try {
      const [docentesRes, gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/docentes'),
        apiClient.get('/grados'),
        apiClient.get('/secciones'),
        apiClient.get('/jornadas')
      ]);

      // Todos los endpoints vienen con {success, data}
      if (docentesRes.data.success) setDocentes(docentesRes.data.data);
      if (gradosRes.data.success) setGrados(gradosRes.data.data);

      // Secciones y Jornadas también vienen con {success, data}
      if (seccionesRes.data.success || seccionesRes.data.data) {
        setSecciones(seccionesRes.data.data || []);
      }
      if (jornadasRes.data.success || jornadasRes.data.data) {
        setJornadas(jornadasRes.data.data || []);
      }

    } catch (error) {
      message.error('Error al cargar catálogos');
    }
  };

  const cargarCursosDisponibles = async () => {
    try {
      const idGrado = form.getFieldValue('idGrado');
      const idSeccion = form.getFieldValue('idSeccion');
      const idJornada = form.getFieldValue('idJornada');
      const anio = form.getFieldValue('Anio');

      // Solo cargar si tenemos todos los valores necesarios
      if (!idGrado || !idSeccion || !idJornada || !anio) {
        setCursos([]);
        return;
      }

      const response = await apiClient.get('/asignaciones/cursos-disponibles', {
        params: { idGrado, idSeccion, idJornada, anio }
      });


      // Manejar diferentes estructuras de respuesta
      let cursosDisponibles = [];

      if (response.data.success && response.data.data) {
        const data = response.data.data;

        // Si data es un array con un objeto de claves numéricas en la primera posición
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          // Convertir objeto con claves numéricas a array
          const primeraEntrada = data[0];
          if (!Array.isArray(primeraEntrada) && typeof primeraEntrada === 'object') {
            cursosDisponibles = Object.values(primeraEntrada).filter(
              item => item && typeof item === 'object' && item.idCurso
            );
          } else if (Array.isArray(primeraEntrada)) {
            cursosDisponibles = primeraEntrada;
          }
        }
        // Si data es un array normal
        else if (Array.isArray(data)) {
          cursosDisponibles = data.filter(item => item && item.idCurso);
        }
        // Si data es un objeto único, convertirlo en array
        else if (typeof data === 'object' && data.idCurso) {
          cursosDisponibles = [data];
        }
      } else if (Array.isArray(response.data)) {
        cursosDisponibles = response.data;
      }

      setCursos(cursosDisponibles);

      // Si no hay cursos disponibles, mostrar mensaje
      if (cursosDisponibles.length === 0) {
        message.info('Todos los cursos de este grado ya han sido asignados para esta sección, jornada y año');
      }
    } catch (error) {
      message.error('Error al cargar cursos disponibles');
      setCursos([]);
    }
  };

  const validarDuplicado = async () => {
    try {
      const values = form.getFieldsValue();

      // Validar que todos los campos necesarios estén presentes
      if (!values.idDocente || !values.idCurso || !values.idGrado ||
          !values.idSeccion || !values.idJornada || !values.Anio) {
        setDuplicado(null);
        return;
      }

      setValidando(true);

      const response = await apiClient.get('/asignaciones/validar', {
        params: {
          idDocente: values.idDocente,
          idCurso: values.idCurso,
          idGrado: values.idGrado,
          idSeccion: values.idSeccion,
          idJornada: values.idJornada,
          anio: values.Anio
        }
      });

      if (response.data.success) {
        setDuplicado(response.data.data);
      }
    } catch (error) {
      setDuplicado(null);
    } finally {
      setValidando(false);
    }
  };

  const handleComboCambiado = () => {
    // Limpiar curso y docente seleccionado cuando cambia cualquier combo
    form.setFieldsValue({ idCurso: undefined, idDocente: undefined });
    setDuplicado(null);
    // Recargar cursos disponibles
    cargarCursosDisponibles();
  };

  const handleDocenteChange = () => {
    setDuplicado(null);
    validarDuplicado();
  };

  const handleCursoChange = () => {
    setDuplicado(null);
    validarDuplicado();
  };

  const handleSubmit = async (values) => {
    // Verificar si hay duplicado
    if (duplicado?.existe) {
      message.error('Ya existe una asignación con estos datos. Por favor revise la información.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
    const IdColaborador = user.IdUsuario;

    setLoading(true);
    try {
      const payload = {
        idDocente: values.idDocente,
        idCurso: values.idCurso,
        idGrado: values.idGrado,
        idSeccion: values.idSeccion,
        idJornada: values.idJornada,
        anio: values.Anio,
        CreadoPor: String(IdColaborador)
      };

      const response = await apiClient.post('/asignaciones', payload);

      if (response.data.success) {
        message.success({
          content: response.data.message || 'Asignación creada exitosamente. Se crearon 4 unidades automáticamente.',
          duration: 10
        });
        form.resetFields();
        setCursos([]);
        setDuplicado(null);
        onSuccess();
      } else {
        message.error(response.data.message || 'Error al crear asignación');
      }
    } catch (error) {
      const mensajeError = error.response?.data?.message || 'Error al crear asignación';
      message.error(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <span>
          <BookOutlined /> Nueva Asignación de Curso
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={650}
      destroyOnClose
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
            <Option value={2028}>2028</Option>
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
            showSearch
            optionFilterProp="children"
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
          name="idCurso"
          label="5. Curso (solo disponibles)"
          rules={[{ required: true, message: 'Por favor seleccione el curso' }]}
        >
          <Select
            placeholder={cursos.length > 0 ? "Seleccione el curso" : "Primero complete los campos anteriores"}
            showSearch
            optionFilterProp="children"
            disabled={cursos.length === 0}
            onChange={handleCursoChange}
          >
            {cursos.map(curso => (
              <Option key={curso.idCurso} value={curso.idCurso}>
                {curso.NombreCurso}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="idDocente"
          label="6. Docente"
          rules={[{ required: true, message: 'Por favor seleccione el docente' }]}
        >
          <Select
            placeholder="Seleccione el docente"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onChange={handleDocenteChange}
          >
            {docentes.map(doc => (
              <Option key={doc.idDocente} value={doc.idDocente}>
                {doc.NombreDocente}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Indicador de validación */}
        {validando && (
          <Alert
            message={
              <Space>
                <Spin size="small" />
                Validando disponibilidad...
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Alerta de duplicado */}
        {duplicado?.existe && (
          <Alert
            message="Asignación Duplicada"
            description={duplicado.mensaje || 'Ya existe una asignación con estos datos para este año escolar.'}
            type="error"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Alerta de disponibilidad */}
        {duplicado !== null && !duplicado.existe && (
          <Alert
            message="Disponible"
            description="Esta asignación está disponible y puede ser creada."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

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
            <Button onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={duplicado?.existe}
            >
              Crear Asignación
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CrearAsignacionModal;

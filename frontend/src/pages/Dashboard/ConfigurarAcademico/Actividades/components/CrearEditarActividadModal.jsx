import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Switch, message, Alert, Space, Tag } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const CrearEditarActividadModal = ({ visible, actividad, unidad, modoEdicion, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tipoActividad, setTipoActividad] = useState('zona');
  const [punteoActual, setPunteoActual] = useState(0);
  const [validacionPunteo, setValidacionPunteo] = useState({ valida: true, mensaje: '' });
  const [tieneCalificaciones, setTieneCalificaciones] = useState(false);
  const [cantidadCalificaciones, setCantidadCalificaciones] = useState(0);

  useEffect(() => {
    console.log('🔷 Modal visible cambió:', visible);
    console.log('   Modo edición:', modoEdicion);
    console.log('   Unidad:', unidad);

    if (visible) {
      if (modoEdicion && actividad) {
        // Modo edición: cargar datos de la actividad
        console.log('   Cargando datos de actividad para edición:', actividad);
        form.setFieldsValue({
          NombreActividad: actividad.NombreActividad,
          Descripcion: actividad.Descripcion,
          PunteoMaximo: parseFloat(actividad.PunteoMaximo),
          TipoActividad: actividad.TipoActividad,
          FechaActividad: actividad.FechaActividad ? dayjs(actividad.FechaActividad) : null,
          Estado: actividad.Estado
        });
        setTipoActividad(actividad.TipoActividad);
        setPunteoActual(parseFloat(actividad.PunteoMaximo));
      } else {
        // Modo creación: limpiar formulario
        console.log('   Modo creación: limpiando formulario');
        form.resetFields();
        setTipoActividad('zona');
        setPunteoActual(0);
      }

      // Validar punteo inicial
      validarPunteoDisponible('zona', 0);
    }
  }, [visible, actividad, modoEdicion, form]);

  const validarPunteoDisponible = async (tipo, punteo, estadoActividad = true) => {
    if (!unidad) return;

    try {
      // Obtener todas las actividades de la unidad
      const response = await apiClient.get(`/actividades/unidad/${unidad.IdUnidad}`);
      const actividadesExistentes = response.data.success ? response.data.data : [];

      // Filtrar actividades del mismo tipo que estén ACTIVAS, excluyendo la actividad actual si estamos editando
      const actividadesMismoTipo = actividadesExistentes.filter(a =>
        a.TipoActividad === tipo &&
        (a.Estado === true || a.Estado === 1) && // Solo contar actividades activas
        (!modoEdicion || a.IdActividad !== actividad?.IdActividad)
      );

      // Sumar punteos existentes de actividades activas
      const sumaExistente = actividadesMismoTipo.reduce((acc, a) => acc + parseFloat(a.PunteoMaximo || 0), 0);

      // Si la actividad va a estar activa, sumar su punteo. Si va a estar inactiva, no sumarlo
      const nuevaSuma = estadoActividad ? sumaExistente + parseFloat(punteo || 0) : sumaExistente;

      // Obtener punteo máximo configurado
      const punteoMaximoConfig = tipo === 'zona'
        ? parseFloat(unidad.PunteoZona)
        : parseFloat(unidad.PunteoFinal);

      const disponible = punteoMaximoConfig - sumaExistente;

      if (nuevaSuma > punteoMaximoConfig) {
        setValidacionPunteo({
          valida: false,
          mensaje: `El punteo excede el máximo permitido. Disponible: ${disponible} pts`,
          sumaExistente,
          punteoMaximoConfig,
          disponible
        });
      } else if (nuevaSuma === punteoMaximoConfig) {
        setValidacionPunteo({
          valida: true,
          mensaje: `Perfecto! Se completarán los ${punteoMaximoConfig} pts configurados`,
          sumaExistente,
          punteoMaximoConfig,
          disponible,
          completo: true
        });
      } else {
        setValidacionPunteo({
          valida: true,
          mensaje: `Quedarán ${punteoMaximoConfig - nuevaSuma} pts disponibles de ${punteoMaximoConfig} pts`,
          sumaExistente,
          punteoMaximoConfig,
          disponible
        });
      }
    } catch (error) {
      console.error('Error al validar punteo:', error);
    }
  };

  const handleTipoChange = (value) => {
    setTipoActividad(value);
    const punteo = form.getFieldValue('PunteoMaximo') || 0;
    const estado = form.getFieldValue('Estado') !== undefined ? form.getFieldValue('Estado') : true;
    validarPunteoDisponible(value, punteo, estado);
  };

  const handlePunteoChange = (value) => {
    setPunteoActual(value || 0);
    const estado = form.getFieldValue('Estado') !== undefined ? form.getFieldValue('Estado') : true;
    validarPunteoDisponible(tipoActividad, value || 0, estado);
  };

  const handleEstadoChange = (checked) => {
    const punteo = form.getFieldValue('PunteoMaximo') || 0;
    validarPunteoDisponible(tipoActividad, punteo, checked);
  };

  const handleSubmit = async () => {
    console.log('🔵 handleSubmit llamado');
    console.log('   Unidad:', unidad);
    console.log('   Modo edición:', modoEdicion);

    try {
      const values = await form.validateFields();
      console.log('✅ Validación de formulario exitosa:', values);

      if (!validacionPunteo.valida) {
        console.log('❌ Validación de punteo falló:', validacionPunteo);
        message.error('El punteo ingresado excede el máximo permitido');
        return;
      }

      setLoading(true);

      const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };

      // Obtener el idDocente del usuario si es docente (rol 4)
      let userIdForCreation = String(user.IdUsuario);
      if (user.rol === 4) {
        try {
          const docentesResponse = await apiClient.get('/docentes');
          if (docentesResponse.data.success) {
            const miDocente = docentesResponse.data.data.find(doc => doc.idUsuario === user.IdUsuario);
            if (miDocente) {
              userIdForCreation = String(miDocente.idDocente);
              console.log('   Docente encontrado - idDocente:', userIdForCreation);
            }
          }
        } catch (error) {
          console.error('Error al obtener idDocente:', error);
        }
      }

      const payload = {
        IdUnidad: unidad.IdUnidad,
        NombreActividad: values.NombreActividad,
        Descripcion: values.Descripcion,
        PunteoMaximo: values.PunteoMaximo,
        TipoActividad: values.TipoActividad,
        FechaActividad: values.FechaActividad ? values.FechaActividad.format('YYYY-MM-DD') : null,
        Estado: values.Estado !== undefined ? values.Estado : true,
        CreadoPor: userIdForCreation,
        ModificadoPor: userIdForCreation
      };

      console.log('📤 Enviando payload:', payload);

      let response;
      if (modoEdicion) {
        console.log('   Endpoint:', `PUT /actividades/${actividad.IdActividad}`);
        response = await apiClient.put(`/actividades/${actividad.IdActividad}`, payload);
      } else {
        console.log('   Endpoint:', 'POST /actividades');
        response = await apiClient.post('/actividades', payload);
      }

      console.log('📥 Respuesta del servidor:', response);
      console.log('   Response.data:', response.data);

      if (response.data.success) {
        message.success(modoEdicion ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente');
        onSuccess();
      }
    } catch (error) {
      console.error('❌ Error al guardar actividad:', error);
      console.error('   Error response:', error.response?.data);
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Error al guardar la actividad');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={modoEdicion ? 'Editar Actividad' : 'Nueva Actividad'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText={modoEdicion ? 'Actualizar' : 'Crear'}
      cancelText="Cancelar"
    >
      {unidad && (
        <Alert
          message={`Unidad ${unidad.NumeroUnidad}: ${unidad.NombreUnidad}`}
          description={`Zona: ${unidad.PunteoZona} pts | Final: ${unidad.PunteoFinal} pts`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          TipoActividad: 'zona',
          Estado: true
        }}
      >
        <Form.Item
          name="NombreActividad"
          label="Nombre de la Actividad"
          rules={[
            { required: true, message: 'Ingrese el nombre de la actividad' },
            { max: 100, message: 'Máximo 100 caracteres' }
          ]}
        >
          <Input placeholder="Ej: Tarea 1 - Investigación" />
        </Form.Item>

        <Form.Item
          name="Descripcion"
          label="Descripción"
          rules={[
            { max: 500, message: 'Máximo 500 caracteres' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Descripción detallada de la actividad"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Space style={{ width: '100%' }} size="large">
          <Form.Item
            name="TipoActividad"
            label="Tipo de Actividad"
            rules={[{ required: true, message: 'Seleccione el tipo' }]}
            style={{ width: 200 }}
          >
            <Select onChange={handleTipoChange} placeholder="Seleccione tipo">
              <Option value="zona">Zona</Option>
              <Option value="final">Final</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="PunteoMaximo"
            label="Punteo Máximo"
            rules={[
              { required: true, message: 'Ingrese el punteo' },
              { type: 'number', min: 0.01, message: 'Debe ser mayor a 0' }
            ]}
            style={{ width: 150 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              max={100}
              step={0.5}
              precision={2}
              placeholder="0.00"
              onChange={handlePunteoChange}
            />
          </Form.Item>

          <Form.Item
            name="FechaActividad"
            label="Fecha de Entrega"
            style={{ width: 180 }}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Seleccione fecha"
            />
          </Form.Item>
        </Space>

        {/* Validación de punteo en tiempo real */}
        {validacionPunteo && (
          <Alert
            message={
              <Space>
                {validacionPunteo.valida ? (
                  validacionPunteo.completo ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <CheckCircleOutlined style={{ color: '#1890ff' }} />
                  )
                ) : (
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                )}
                <span>{validacionPunteo.mensaje}</span>
              </Space>
            }
            description={
              validacionPunteo.sumaExistente !== undefined && (
                <div>
                  <div>
                    <strong>Actividades existentes:</strong> {validacionPunteo.sumaExistente} pts
                  </div>
                  <div>
                    <strong>Con esta actividad:</strong> {validacionPunteo.sumaExistente + punteoActual} pts
                  </div>
                  <div>
                    <strong>Configurado para {tipoActividad}:</strong> {validacionPunteo.punteoMaximoConfig} pts
                  </div>
                </div>
              )
            }
            type={validacionPunteo.valida ? (validacionPunteo.completo ? 'success' : 'info') : 'error'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="Estado"
          label="Estado de la Actividad"
          valuePropName="checked"
          help="Las actividades inactivas no se mostrarán a los estudiantes ni contarán para el puntaje total"
        >
          <Switch
            checkedChildren="Activa"
            unCheckedChildren="Inactiva"
            onChange={handleEstadoChange}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CrearEditarActividadModal;

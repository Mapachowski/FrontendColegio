import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Button, message, Space, Tag, Alert } from 'antd';
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';

const ConfigurarPunteosModal = ({ visible, unidad, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suma, setSuma] = useState(100);

  useEffect(() => {
    if (visible && unidad) {
      const zona = parseFloat(unidad.PunteoZona);
      const final = parseFloat(unidad.PunteoFinal);

      form.setFieldsValue({
        PunteoZona: zona,
        PunteoFinal: final,
      });

      setSuma(zona + final);
    }
  }, [visible, unidad, form]);

  const handleValuesChange = (changedValues, allValues) => {
    const zona = parseFloat(allValues.PunteoZona) || 0;
    const final = parseFloat(allValues.PunteoFinal) || 0;
    setSuma(zona + final);
  };

  const handleSubmit = async (values) => {
    const zona = parseFloat(values.PunteoZona);
    const final = parseFloat(values.PunteoFinal);

    // Validación adicional en el frontend
    if (zona + final !== 100) {
      message.error(`La suma debe ser exactamente 100. Suma actual: ${zona + final}`);
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };

      const response = await apiClient.put(`/unidades/${unidad.IdUnidad}/punteos`, {
        PunteoZona: zona,
        PunteoFinal: final,
        ModificadoPor: String(user.IdUsuario)
      });

      if (response.data.success) {
        message.success(response.data.message || 'Punteos actualizados correctamente');
        form.resetFields();
        onSuccess();
      }
    } catch (error) {
      console.error('Error al actualizar punteos:', error);
      message.error(error.response?.data?.error || 'Error al actualizar los punteos');
    } finally {
      setLoading(false);
    }
  };

  const aplicarPreset = (zona, final) => {
    form.setFieldsValue({ PunteoZona: zona, PunteoFinal: final });
    setSuma(zona + final);
  };

  const handleCancel = () => {
    form.resetFields();
    setSuma(100);
    onCancel();
  };

  return (
    <Modal
      title={
        <span>
          Configurar Punteos - Unidad {unidad?.NumeroUnidad}
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
          disabled={suma !== 100}
        >
          Guardar Configuración
        </Button>
      ]}
      width={600}
    >
      {unidad && (
        <>
          <Alert
            message="Configuración de Punteos"
            description={
              <div>
                <p>La suma de <strong>Punteo Zona</strong> + <strong>Punteo Final</strong> debe ser exactamente <strong>100 puntos</strong>.</p>
                <p style={{ marginBottom: 0 }}>Use los presets rápidos o ingrese valores personalizados.</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          {/* Presets rápidos */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ marginBottom: 8, fontWeight: 'bold' }}>Configuraciones Comunes:</p>
            <Space wrap>
              <Button size="small" onClick={() => aplicarPreset(60, 40)}>
                60/40 (Por defecto)
              </Button>
              <Button size="small" onClick={() => aplicarPreset(70, 30)}>
                70/30
              </Button>
              <Button size="small" onClick={() => aplicarPreset(80, 20)}>
                80/20
              </Button>
              <Button size="small" onClick={() => aplicarPreset(90, 10)}>
                90/10
              </Button>
              <Button size="small" onClick={() => aplicarPreset(100, 0)}>
                100/0 (Solo zona)
              </Button>
              <Button size="small" onClick={() => aplicarPreset(0, 100)}>
                0/100 (Solo examen)
              </Button>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={handleValuesChange}
          >
            <Form.Item
              label="Punteo Zona"
              name="PunteoZona"
              rules={[
                { required: true, message: 'El punteo de zona es requerido' },
                {
                  type: 'number',
                  min: 0,
                  max: 100,
                  message: 'Debe ser entre 0 y 100'
                }
              ]}
              extra="Puntos asignados a actividades, tareas y trabajos durante la unidad"
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '100%' }}
                precision={0}
                step={5}
              />
            </Form.Item>

            <Form.Item
              label="Punteo Examen Final"
              name="PunteoFinal"
              rules={[
                { required: true, message: 'El punteo final es requerido' },
                {
                  type: 'number',
                  min: 0,
                  max: 100,
                  message: 'Debe ser entre 0 y 100'
                }
              ]}
              extra="Puntos asignados al examen final de la unidad"
            >
              <InputNumber
                min={0}
                max={100}
                style={{ width: '100%' }}
                precision={0}
                step={5}
              />
            </Form.Item>

            {/* Indicador de suma */}
            <div style={{
              padding: '12px',
              background: suma === 100 ? '#f6ffed' : '#fff2e8',
              border: `1px solid ${suma === 100 ? '#b7eb8f' : '#ffbb96'}`,
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              <Space>
                {suma === 100 ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                ) : (
                  <WarningOutlined style={{ color: '#fa8c16', fontSize: '18px' }} />
                )}
                <span style={{ fontWeight: 'bold' }}>
                  Suma Total: <Tag color={suma === 100 ? 'success' : 'warning'}>{suma} pts</Tag>
                </span>
                {suma === 100 ? (
                  <span style={{ color: '#52c41a' }}>Configuración válida</span>
                ) : (
                  <span style={{ color: '#fa8c16' }}>La suma debe ser 100</span>
                )}
              </Space>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default ConfigurarPunteosModal;

// src/pages/dashboard/alumnos/components/EditarFamiliaModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Card, Row, Col, message, Spin, Tag } from 'antd';
import apiClient from '../../../../api/apiClient';

const EditarFamiliaModal = ({ open, onCancel, familiaData, onFamiliaActualizada }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showResponsables, setShowResponsables] = useState(false);
  const [padre, setPadre] = useState(null);
  const [madre, setMadre] = useState(null);
  const [otro, setOtro] = useState(null);

  // Cargar responsables cuando se abre el modal
  useEffect(() => {
    const cargarResponsables = async () => {
      if (!familiaData?.IdFamilia || !open) return;

      try {
        // Cargar responsables usando el nuevo endpoint
        const res = await apiClient.get(`/responsables/familia/${familiaData.IdFamilia}`);
        const listaResponsables = Array.isArray(res.data) ? res.data : res.data.data || [];

        console.log('RESPONSABLES CARGADOS:', listaResponsables);

        // Separar por tipo de responsable (IdResponsableTipo)
        const padreTipo = listaResponsables.find(r => r.IdResponsableTipo === 1); // Padre
        const madreTipo = listaResponsables.find(r => r.IdResponsableTipo === 2); // Madre
        const otroTipo = listaResponsables.find(r => r.IdResponsableTipo === 11); // Otro

        setPadre(padreTipo || null);
        setMadre(madreTipo || null);
        setOtro(otroTipo || null);

        console.log('PADRE:', padreTipo);
        console.log('MADRE:', madreTipo);
        console.log('OTRO:', otroTipo);
      } catch (error) {
        console.error('ERROR CARGANDO RESPONSABLES:', error);
        console.error('Detalles del error:', error.response?.data || error.message);
        // No mostrar error al usuario si no hay responsables
      }
    };

    cargarResponsables();
  }, [familiaData, open]);

  // Prellenar el formulario con datos de familia
  useEffect(() => {
    if (familiaData && open) {
      form.setFieldsValue({
        NombreRecibo: familiaData.NombreRecibo || '',
        TelefonoRecibo: familiaData.TelefonoRecibo || '',
        CorreoElectronico: familiaData.CorreoElectronico || '',
        DireccionRecibo: familiaData.DireccionRecibo || '',
      });
    }
  }, [familiaData, open, form]);

  // Prellenar responsables cuando se muestran
  useEffect(() => {
    if (showResponsables) {
      form.setFieldsValue({
        PadreNombre: padre?.NombreResponsable || '',
        PadreDPI: padre?.DPI || '',
        PadreNIT: padre?.NIT || '',
        MadreNombre: madre?.NombreResponsable || '',
        MadreDPI: madre?.DPI || '',
        MadreNIT: madre?.NIT || '',
        OtroNombre: otro?.NombreResponsable || '',
        OtroDPI: otro?.DPI || '',
        OtroNIT: otro?.NIT || '',
      });
    }
  }, [showResponsables, padre, madre, otro, form]);

  const handleGuardar = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Obtener IdColaborador del localStorage
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const IdColaborador = userFromStorage.IdUsuario;

      if (!IdColaborador) {
        message.error('No se encontró el usuario en sesión. Por favor, recarga la página.');
        setLoading(false);
        return;
      }

      console.log('IdColaborador obtenido:', IdColaborador);

      // 1. Actualizar datos de familia
      await apiClient.put(`/familias/${familiaData.IdFamilia}`, {
        NombreRecibo: values.NombreRecibo,
        TelefonoContacto: values.TelefonoRecibo,
        EmailContacto: values.CorreoElectronico,
        DireccionRecibo: values.DireccionRecibo,
        IdColaborador, // Agregado campo requerido
      });

      // 2. Actualizar responsables si se modificaron
      if (showResponsables) {

        // Actualizar Padre
        if (values.PadreNombre) {
          if (padre?.IdResponsable) {
            await apiClient.put(`/responsables/${padre.IdResponsable}`, {
              NombreResponsable: values.PadreNombre,
              DPI: values.PadreDPI || null,
              NIT: values.PadreNIT || null,
              IdColaborador, // Agregado campo requerido
            });
          } else {
            await apiClient.post('/responsables', {
              NombreResponsable: values.PadreNombre,
              DPI: values.PadreDPI || null,
              NIT: values.PadreNIT || null,
              IdFamilia: familiaData.IdFamilia,
              IdResponsableTipo: 1,
              EsResponsable: false,
              IdColaborador,
            });
          }
        }

        // Actualizar Madre
        if (values.MadreNombre) {
          if (madre?.IdResponsable) {
            await apiClient.put(`/responsables/${madre.IdResponsable}`, {
              NombreResponsable: values.MadreNombre,
              DPI: values.MadreDPI || null,
              NIT: values.MadreNIT || null,
              IdColaborador, // Agregado campo requerido
            });
          } else {
            await apiClient.post('/responsables', {
              NombreResponsable: values.MadreNombre,
              DPI: values.MadreDPI || null,
              NIT: values.MadreNIT || null,
              IdFamilia: familiaData.IdFamilia,
              IdResponsableTipo: 2,
              EsResponsable: false,
              IdColaborador,
            });
          }
        }

        // Actualizar Otro
        if (values.OtroNombre) {
          if (otro?.IdResponsable) {
            await apiClient.put(`/responsables/${otro.IdResponsable}`, {
              NombreResponsable: values.OtroNombre,
              DPI: values.OtroDPI || null,
              NIT: values.OtroNIT || null,
              IdColaborador, // Agregado campo requerido
            });
          } else {
            await apiClient.post('/responsables', {
              NombreResponsable: values.OtroNombre,
              DPI: values.OtroDPI || null,
              NIT: values.OtroNIT || null,
              IdFamilia: familiaData.IdFamilia,
              IdResponsableTipo: 11,
              EsResponsable: false,
              IdColaborador,
            });
          }
        }
      }

      message.success('Datos actualizados correctamente');

      // Actualizar datos en el componente padre
      const familiaActualizada = {
        ...familiaData,
        NombreRecibo: values.NombreRecibo,
        TelefonoRecibo: values.TelefonoRecibo,
        CorreoElectronico: values.CorreoElectronico,
        DireccionRecibo: values.DireccionRecibo,
      };
      onFamiliaActualizada(familiaActualizada);
      onCancel();
    } catch (error) {
      console.error('ERROR AL GUARDAR:', error);
      message.error('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Editar Datos de Facturación y Familia"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <Card title="Datos de Facturación" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16, padding: 12, background: '#f0f5ff', borderRadius: 8, border: '1px solid #d6e4ff' }}>
              <strong>Familia:</strong> <span style={{ color: '#1890ff', fontSize: 16 }}>{familiaData?.NombreFamilia || 'No especificado'}</span>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Nombre para recibo" name="NombreRecibo">
                  <Input placeholder="Ej: Familia Pérez López" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Teléfono de contacto" name="TelefonoRecibo">
                  <Input placeholder="4444-5555" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Email" name="CorreoElectronico">
                  <Input placeholder="familia@email.com" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Dirección completa" name="DireccionRecibo">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <Button
              type="dashed"
              size="large"
              onClick={() => setShowResponsables(!showResponsables)}
              style={{ width: 300 }}
            >
              {showResponsables ? 'Ocultar Responsables' : 'Editar Responsables'}
            </Button>
          </div>

          {showResponsables && (
            <Card title="Responsables" style={{ marginTop: 16 }}>
              {/* PADRE */}
              <div style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
                <Space align="center" style={{ marginBottom: 12 }}>
                  <strong>PADRE</strong>
                  {padre?.EsResponsable && <Tag color="blue">Responsable Principal</Tag>}
                </Space>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="PadreNombre">
                      <Input placeholder="Nombre completo del padre" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="PadreDPI">
                      <Input placeholder="DPI" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="PadreNIT">
                      <Input placeholder="NIT" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* MADRE */}
              <div style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
                <Space align="center" style={{ marginBottom: 12 }}>
                  <strong>MADRE</strong>
                  {madre?.EsResponsable && <Tag color="blue">Responsable Principal</Tag>}
                </Space>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="MadreNombre">
                      <Input placeholder="Nombre completo de la madre" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="MadreDPI">
                      <Input placeholder="DPI" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="MadreNIT">
                      <Input placeholder="NIT" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* OTRO */}
              <div style={{ marginBottom: 24, padding: 16, background: '#f0f8ff', borderRadius: 8, border: '1px dashed #1890ff' }}>
                <Space align="center" style={{ marginBottom: 12 }}>
                  <strong>OTRO RESPONSABLE</strong>
                  {otro?.EsResponsable && <Tag color="blue">Responsable Principal</Tag>}
                </Space>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="OtroNombre">
                      <Input placeholder="Nombre completo" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="OtroDPI">
                      <Input placeholder="DPI" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="OtroNIT">
                      <Input placeholder="NIT" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Card>
          )}

          <div style={{ textAlign: 'right', marginTop: 32 }}>
            <Button onClick={onCancel} style={{ marginRight: 12 }}>
              Cancelar
            </Button>
            <Button type="primary" size="large" onClick={handleGuardar} loading={loading}>
              Guardar Todos los Cambios
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default EditarFamiliaModal;
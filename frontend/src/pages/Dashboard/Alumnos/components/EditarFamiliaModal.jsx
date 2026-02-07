// src/pages/dashboard/alumnos/components/EditarFamiliaModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Card, Row, Col, message, Spin, Tag } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import apiClient from '../../../../api/apiClient';

const EditarFamiliaModal = ({ open, onCancel, familiaData, onFamiliaActualizada }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showResponsables, setShowResponsables] = useState(false);
  const [showUsuario, setShowUsuario] = useState(false);
  const [usuarioFamilia, setUsuarioFamilia] = useState(null);
  const [loadingUsuario, setLoadingUsuario] = useState(false);
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


        // Separar por tipo de responsable (IdResponsableTipo)
        const padreTipo = listaResponsables.find(r => r.IdResponsableTipo === 1); // Padre
        const madreTipo = listaResponsables.find(r => r.IdResponsableTipo === 2); // Madre
        const otroTipo = listaResponsables.find(r => r.IdResponsableTipo === 11); // Otro

        setPadre(padreTipo || null);
        setMadre(madreTipo || null);
        setOtro(otroTipo || null);

      } catch (error) {
        // No mostrar error al usuario si no hay responsables
      }
    };

    cargarResponsables();
  }, [familiaData, open]);

  // Prellenar el formulario con datos de familia
  useEffect(() => {
    if (familiaData && open) {
      form.setFieldsValue({
        NombreFamilia: familiaData.NombreFamilia || '',
        NombreRecibo: familiaData.NombreRecibo || '',
        TelefonoRecibo: familiaData.TelefonoRecibo || '',
        CorreoElectronico: familiaData.CorreoElectronico || '',
        DireccionRecibo: familiaData.DireccionRecibo || '',
      });
    }
  }, [familiaData, open, form]);

  // Cargar usuario de la familia cuando se muestra la sección
  const cargarUsuarioFamilia = async () => {
    if (!familiaData?.IdUsuario) {
      setUsuarioFamilia(null);
      return;
    }
    setLoadingUsuario(true);
    try {
      const res = await apiClient.get(`/usuarios/${familiaData.IdUsuario}`);
      const datos = res.data.data || res.data;
      setUsuarioFamilia(datos);
    } catch (error) {
      message.error('Error al cargar datos del usuario');
      setUsuarioFamilia(null);
    } finally {
      setLoadingUsuario(false);
    }
  };

  const handleToggleUsuario = () => {
    if (!showUsuario && !usuarioFamilia) {
      cargarUsuarioFamilia();
    }
    setShowUsuario(!showUsuario);
  };

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


      // 1. Actualizar datos de familia
      await apiClient.put(`/familias/${familiaData.IdFamilia}`, {
        NombreFamilia: values.NombreFamilia,
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
        NombreFamilia: values.NombreFamilia,
        NombreRecibo: values.NombreRecibo,
        TelefonoRecibo: values.TelefonoRecibo,
        CorreoElectronico: values.CorreoElectronico,
        DireccionRecibo: values.DireccionRecibo,
      };
      onFamiliaActualizada(familiaActualizada);
      onCancel();
    } catch (error) {
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
          <Card title="Datos de Familia" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Nombre de la Familia" name="NombreFamilia" rules={[{ required: true, message: 'El nombre de la familia es requerido' }]}>
                  <Input placeholder="Ej: Pérez López" style={{ fontSize: 16, fontWeight: 'bold' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Datos de Facturación" style={{ marginBottom: 24 }}>
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

          <div style={{ textAlign: 'center', margin: '30px 0', display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Button
              type="dashed"
              size="large"
              icon={<TeamOutlined />}
              onClick={() => setShowResponsables(!showResponsables)}
              style={{ width: 250 }}
            >
              {showResponsables ? 'Ocultar Responsables' : 'Editar Responsables'}
            </Button>
            <Button
              type="dashed"
              size="large"
              icon={<UserOutlined />}
              onClick={handleToggleUsuario}
              style={{ width: 250 }}
              disabled={!familiaData?.IdUsuario}
            >
              {showUsuario ? 'Ocultar Usuario' : 'Ver Usuario'}
            </Button>
          </div>

          {showUsuario && (
            <Card title="Usuario de la Familia" style={{ marginTop: 16, marginBottom: 16 }}>
              {loadingUsuario ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Spin />
                </div>
              ) : usuarioFamilia ? (
                <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: '#595959' }}>Nombre de Usuario:</strong>
                      </div>
                      <Input value={usuarioFamilia.NombreUsuario || '-'} disabled style={{ color: '#262626', backgroundColor: '#fff' }} />
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: '#595959' }}>Nombre Completo:</strong>
                      </div>
                      <Input value={usuarioFamilia.NombreCompleto || '-'} disabled style={{ color: '#262626', backgroundColor: '#fff' }} />
                    </Col>
                  </Row>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>
                  No se encontró usuario asociado a esta familia
                </div>
              )}
            </Card>
          )}

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
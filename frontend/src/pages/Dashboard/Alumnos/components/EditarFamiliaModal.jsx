// src/pages/dashboard/alumnos/components/EditarFamiliaModal.jsx
import React, { useState } from 'react';
import { Modal, Form, Input, Button, Checkbox, Space, Card, Row, Col } from 'antd';

const EditarFamiliaModal = ({ open, onCancel }) => {
  const [showResponsables, setShowResponsables] = useState(false);
  const [otroVisible, setOtroVisible] = useState(false);
  const [responsablePrincipal, setResponsablePrincipal] = useState(null);

  const handlePrincipalChange = (tipo) => {
    setResponsablePrincipal(tipo);
  };

  return (
    <Modal
      title="Editar Datos de Facturación y Familia"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      <Form layout="vertical">
        <Card title="Datos de Facturación" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Nombre para recibo">
                <Input placeholder="Ej: Familia Pérez López" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Teléfono de contacto">
                <Input placeholder="4444-5555" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Email">
                <Input placeholder="familia@email.com" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Dirección completa">
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
            {showResponsables ? 'Ocultar' : 'Cambiar Responsables'}
          </Button>
        </div>

        {showResponsables && (
          <Card title="Responsables" style={{ marginTop: 16 }}>
            {/* PADRE */}
            <div style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <Space align="center" style={{ marginBottom: 12 }}>
                <strong>PADRE</strong>
                <Checkbox
                  checked={responsablePrincipal === 'padre'}
                  onChange={() => handlePrincipalChange('padre')}
                >
                  Es responsable principal
                </Checkbox>
              </Space>
              <Row gutter={16}>
                <Col span={12}><Input placeholder="Nombre completo del padre" /></Col>
                <Col span={6}><Input placeholder="DPI" /></Col>
                <Col span={6}><Input placeholder="NIT" /></Col>
              </Row>
            </div>

            {/* MADRE */}
            <div style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
              <Space align="center" style={{ marginBottom: 12 }}>
                <strong>MADRE</strong>
                <Checkbox
                  checked={responsablePrincipal === 'madre'}
                  onChange={() => handlePrincipalChange('madre')}
                >
                  Es responsable principal
                </Checkbox>
              </Space>
              <Row gutter={16}>
                <Col span={12}><Input placeholder="Nombre completo de la madre" /></Col>
                <Col span={6}><Input placeholder="DPI" /></Col>
                <Col span={6}><Input placeholder="NIT" /></Col>
              </Row>
            </div>

            {/* OTRO */}
            <div style={{ marginBottom: 24 }}>
              <Checkbox
                checked={otroVisible}
                onChange={(e) => setOtroVisible(e.target.checked)}
              >
                <strong>Agregar Otro Responsable</strong>
              </Checkbox>

              {otroVisible && (
                <div style={{ marginTop: 16, padding: 16, background: '#f0f8ff', borderRadius: 8, border: '1px dashed #1890ff' }}>
                  <Space align="center" style={{ marginBottom: 12 }}>
                    <strong>OTRO RESPONSABLE</strong>
                    <Checkbox
                      checked={responsablePrincipal === 'otro'}
                      onChange={() => handlePrincipalChange('otro')}
                    >
                      Es responsable principal
                    </Checkbox>
                  </Space>
                  <Row gutter={16}>
                    <Col span={12}><Input placeholder="Nombre completo" /></Col>
                    <Col span={6}><Input placeholder="DPI" /></Col>
                    <Col span={6}><Input placeholder="NIT" /></Col>
                  </Row>
                </div>
              )}
            </div>
          </Card>
        )}

        <div style={{ textAlign: 'right', marginTop: 32 }}>
          <Button onClick={onCancel} style={{ marginRight: 12 }}>
            Cancelar
          </Button>
          <Button type="primary" size="large">
            Guardar Todos los Cambios
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditarFamiliaModal;
// src/pages/dashboard/alumnos/EditarAlumno.jsx
import React, { useState } from 'react';
import {
  Card, Tabs, Input, Select, Switch, Button, Space, Tag, Typography, Row, Col
} from 'antd';
import BuscarAlumnoEditarModal from './components/BuscarAlumnoEditarModal';
import EditarFamiliaModal from './components/EditarFamiliaModal';

const { Title } = Typography;
const { TextArea } = Input;

const EditarAlumno = () => {
  const [openBuscar, setOpenBuscar] = useState(true);
  const [openFamilia, setOpenFamilia] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [inscripcionActiva, setInscripcionActiva] = useState(true);

  if (openBuscar) {
    return (
      <BuscarAlumnoEditarModal
        open={true}
        onCancel={() => window.history.back()}
        onBuscar={() => setOpenBuscar(false)}
      />
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Editar Alumno – Juan Carlos Pérez Gómez</Title>
      <Title level={5} type="secondary">
        Matrícula: <Tag color="blue">2025-001</Tag> | Ciclo 2025
      </Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 24 }}>
        {/* PESTAÑA 1 - DATOS PERSONALES Y FAMILIA */}
        <Tabs.TabPane tab="1. Datos Personales y Familia" key="1">
          <Card title="Contacto de Emergencia" style={{ marginBottom: 16 }}>
            <Input addonBefore="Nombre" placeholder="María de Pérez" style={{ marginBottom: 16 }} />
            <Input addonBefore="Teléfono" placeholder="5555-1234" />
            <div style={{ marginTop: 16 }}>
              <Switch defaultChecked />
              <span style={{ marginLeft: 8 }}>Alumno visible en el sistema</span>
            </div>
          </Card>

          <Card
            title="Familia"
            extra={
              <Button type="primary" onClick={() => setOpenFamilia(true)}>
                Modificar Familia
              </Button>
            }
          >
            <p><strong>Recibo a nombre:</strong> Familia Pérez López</p>
            <p><strong>Teléfono:</strong> 4444-5555</p>
            <p><strong>Email:</strong> perezfamilia@email.com</p>
          </Card>

          {/* BOTÓN SIGUIENTE */}
          <div style={{ marginTop: 40, textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={() => setActiveTab('2')}>
              Siguiente →
            </Button>
          </div>
        </Tabs.TabPane>

        {/* PESTAÑA 2 - INSCRIPCIÓN */}
        <Tabs.TabPane tab="2. Inscripción 2025" key="2">
          <Card>
            <p><strong>Grado:</strong> Primero Primaria</p>

            <Space style={{ marginTop: 16 }}>
              <Select style={{ width: 300 }} placeholder="Sección" defaultValue="A">
                <Select.Option value="A">A</Select.Option>
                <Select.Option value="B">B</Select.Option>
                <Select.Option value="C">C</Select.Option>
              </Select>

              <Select style={{ width: 300 }} placeholder="Jornada" defaultValue="Matutina">
                <Select.Option value="Matutina">Matutina</Select.Option>
                <Select.Option value="Vespertina">Vespertina</Select.Option>
              </Select>
            </Space>

            <div style={{ marginTop: 24 }}>
              <Space>
                <Switch
                  checked={inscripcionActiva}
                  onChange={setInscripcionActiva}
                  checkedChildren="Activa"
                  unCheckedChildren="Inactiva"
                />
                <span style={{ fontWeight: 500 }}>Inscripción Activa</span>
              </Space>
            </div>

            {/* OBSERVACIÓN - Aparece solo si está inactiva */}
            {!inscripcionActiva && (
              <div style={{ marginTop: 20 }}>
                <TextArea
                  rows={5}
                  placeholder="Escribe el motivo del retiro, traslado, suspensión, etc. (obligatorio)"
                  style={{
                    borderColor: '#d9363e',
                    boxShadow: '0 0 8px rgba(217, 54, 62, 0.15)'
                  }}
                />
              </div>
            )}
          </Card>

          {/* BOTONES ATRÁS Y GUARDAR */}
          <Row justify="space-between" style={{ marginTop: 40 }}>
            <Col>
              <Button size="large" onClick={() => setActiveTab('1')}>
                ← Atrás
              </Button>
            </Col>
            <Col>
              <Button type="primary" size="large" style={{ minWidth: 240 }}>
                Guardar todos los cambios
              </Button>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>

      <EditarFamiliaModal open={openFamilia} onCancel={() => setOpenFamilia(false)} />
    </div>
  );
};

export default EditarAlumno;
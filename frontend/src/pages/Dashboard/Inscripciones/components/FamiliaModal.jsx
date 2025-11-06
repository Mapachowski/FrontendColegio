// src/pages/dashboard/Inscripciones/components/FamiliaModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Form, Input, Button, Radio, message, Row, Col } from 'antd';
import apiClient from '../../../../api/apiClient';
const { Option } = Select;

const FamiliaModal = ({ open, onSelect, onCancel, state, dispatch }) => {
  const [form] = Form.useForm();
  const [familias, setFamilias] = useState([]);
  const [tiposResponsable, setTiposResponsable] = useState([]);
  const [modo, setModo] = useState('buscar');
  const [responsableSeleccionado, setResponsableSeleccionado] = useState(null);

  // CARGAR FAMILIAS Y TIPOS DE RESPONSABLE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [famRes, tiposRes] = await Promise.all([
          apiClient.get('/familias'),
          apiClient.get('/responsable-tipo'),
        ]);

        console.log('TIPOS DE RESPONSABLE:', tiposRes.data.data); // ← VERIFICA AQUÍ

        setFamilias(Array.isArray(famRes.data.data) ? famRes.data.data : famRes.data);
        setTiposResponsable(Array.isArray(tiposRes.data.data) ? tiposRes.data.data : tiposRes.data);
      } catch (error) {
        console.error('Error cargando datos:', error);
        message.error('Error al cargar datos');
      }
    };

    if (open && modo === 'buscar') {
      fetchData();
    }
  }, [open, modo]);

  const handleCrear = async () => {
    try {
      const values = await form.validateFields();

      // VALIDACIÓN CLAVE
      if (values.PadreNombre && !values.PadreTipo) {
        message.error('Selecciona el tipo de responsable para el padre');
        return;
      }
      if (values.MadreNombre && !values.MadreTipo) {
        message.error('Selecciona el tipo de responsable para la madre');
        return;
      }

      // Validar al menos un responsable
      if (!values.PadreNombre && !values.MadreNombre) {
        message.error('Debe ingresar al menos un responsable');
        return;
      }

      // CREAR FAMILIA
      const familiaRes = await apiClient.post('/familias', {
        NombreFamilia: values.NombreFamilia,
        Direccion: values.Direccion,
        TelefonoContacto: values.TelefonoContacto,
        EmailContacto: values.EmailContacto,
        IdColaborador: state.user.IdColaborador,
        NombreRecibo: values.NombreRecibo || null,
        DireccionRecibo: values.DireccionRecibo || null,
      });

      const nuevaFamilia = familiaRes.data.data || familiaRes.data;

      // ACTUALIZAR PAGO CON DATOS DEL RECIBO
      dispatch({
        type: 'UPDATE_PAGO',
        payload: {
          NombreRecibo: values.NombreRecibo || '',
          DireccionRecibo: values.DireccionRecibo || '',
        },
      });

      // CREAR RESPONSABLES
      const crearResponsable = async (nombre, dpi, nit, tipo) => {
        if (!nombre) return;
        await apiClient.post('/responsables', {
          NombreResponsable: nombre,
          DPI: dpi || null,
          NIT: nit || null,
          IdFamilia: nuevaFamilia.IdFamilia,
          IdResponsableTipo: tipo,
          EsResponsable: responsableSeleccionado === (nombre === values.PadreNombre ? 'padre' : 'madre'),
          IdColaborador: state.user.IdColaborador,
        });
      };

      await crearResponsable(
        values.PadreNombre,
        values.PadreDPI,
        values.PadreNIT,
        values.PadreTipo
      );

      await crearResponsable(
        values.MadreNombre,
        values.MadreDPI,
        values.MadreNIT,
        values.MadreTipo
      );

      message.success('Familia y responsables creados');
      form.resetFields();
      setResponsableSeleccionado(null);
      onSelect(nuevaFamilia);
      onCancel();
    } catch (error) {
      console.error('Error:', error);
      message.error('Error al crear familia');
    }
  };

  return (
    <Modal title="Gestión de Familia" open={open} onCancel={onCancel} footer={null} width={1000}>
      <div style={{ marginBottom: 16 }}>
        <Button
          onClick={() => {
            setModo('buscar');
            form.resetFields();
          }}
          type={modo === 'buscar' ? 'primary' : 'default'}
        >
          Buscar
        </Button>
        <Button
          onClick={() => {
            setModo('nueva');
            form.resetFields();
            setResponsableSeleccionado(null);
          }}
          style={{ marginLeft: 8 }}
          type={modo === 'nueva' ? 'primary' : 'default'}
        >
          Nueva Familia
        </Button>
      </div>

      {modo === 'buscar' ? (
        <>
          <Select
            showSearch
            placeholder="Buscar familia por nombre o dirección"
            style={{ width: '100%' }}
            onChange={(id) => {
              const fam = familias.find((f) => f.IdFamilia === id);
              if (fam) {
                dispatch({ type: 'UPDATE_ALUMNO', payload: { IdFamilia: fam.IdFamilia } });
                dispatch({
                  type: 'UPDATE_PAGO',
                  payload: {
                    NombreRecibo: fam.NombreRecibo || '',
                    DireccionRecibo: fam.DireccionRecibo || '',
                  },
                });
                onSelect(fam);
                onCancel();
              }
            }}
            filterOption={(input, option) =>
              String(option?.children || '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {familias.map((f) => (
              <Option key={f.IdFamilia} value={f.IdFamilia}>
                {f.NombreFamilia || 'Sin nombre'} - {f.Direccion || 'Sin dirección'}
              </Option>
            ))}
          </Select>
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button onClick={onCancel}>Cancelar</Button>
          </div>
        </>
      ) : (
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="NombreFamilia" label="Nombre de la Familia" rules={[{ required: true }]}>
                <Input placeholder="Ej: Familia López Figueroa" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="Direccion" label="Dirección" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="TelefonoContacto" label="Teléfono">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="EmailContacto" label="Email">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* DATOS DEL RECIBO */}
          <div style={{ margin: '16px 0', fontWeight: 'bold', color: '#003366' }}>
            Datos para el Recibo (se pueden editar después)
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="NombreRecibo" label="Nombre en el Recibo">
                <Input placeholder="Ej: Juan Pérez (padre)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="DireccionRecibo" label="Dirección en el Recibo">
                <Input placeholder="Ej: 10ma avenida 5-20, Zona 1" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ margin: '16px 0', fontWeight: 'bold' }}>Responsables</div>

          {/* PADRE */}
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="PadreNombre" label="Nombre del Padre">
                <Input />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="PadreDPI" label="DPI">
                <Input />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="PadreNIT" label="NIT">
                <Input />
              </Form.Item>
            </Col>
           <Col span={4}>
              <Form.Item 
                name="PadreTipo" 
                label="Tipo" 
                rules={[{ required: !!form.getFieldValue('PadreNombre'), message: 'Requerido' }]}
              >
                <Select placeholder="Tipo">
                  {tiposResponsable.map((t, index) => (
                    <Option key={t.IdResponsableTipo ?? index} value={t.IdResponsableTipo}>
                      {t.Tipo}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            </Row>

          {/* MADRE */}
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="MadreNombre" label="Nombre de la Madre">
                <Input />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="MadreDPI" label="DPI">
                <Input />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="MadreNIT" label="NIT">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item 
                name="MadreTipo" 
                label="Tipo" 
                rules={[{ required: !!form.getFieldValue('MadreNombre'), message: 'Requerido' }]}
              >
                <Select placeholder="Tipo">
                  {tiposResponsable.map((t, index) => (
                    <Option key={t.IdResponsableTipo ?? index} value={t.IdResponsableTipo}>
                      {t.Tipo}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="¿Quién es el responsable principal?">
            <Radio.Group onChange={(e) => setResponsableSeleccionado(e.target.value)} value={responsableSeleccionado}>
              <Radio value="padre" disabled={!form.getFieldValue('PadreNombre')}>
                Padre
              </Radio>
              <Radio value="madre" disabled={!form.getFieldValue('MadreNombre')}>
                Madre
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Button type="primary" onClick={handleCrear} style={{ background: '#003366', borderColor: '#003366' }}>
            Crear Familia y Responsables
          </Button>
        </Form>
      )}
    </Modal>
  );
};

export default FamiliaModal;
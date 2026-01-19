// src/pages/dashboard/Inscripciones/components/FamiliaModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Select, Form, Input, Button, Checkbox, message, Row, Col } from 'antd';
import apiClient from '../../../../api/apiClient';
import { jsPDF } from 'jspdf';

const { Option } = Select;

const FamiliaModal = ({ open, onSelect, onCancel, state, dispatch }) => {
  const [form] = Form.useForm();
  const [familias, setFamilias] = useState([]);
  const [tiposResponsable, setTiposResponsable] = useState([]);
  const [modo, setModo] = useState('buscar');
  const [responsablePrincipal, setResponsablePrincipal] = useState(null); // 'padre' | 'madre' | null
  const [showOtroResponsable, setShowOtroResponsable] = useState(false);
  const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');

  // CARGAR FAMILIAS Y TIPOS DE RESPONSABLE
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [famRes, tiposRes] = await Promise.all([
          apiClient.get('/familias'),
          apiClient.get('/responsable-tipo'),
        ]);

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

  // PRELLENAR NOMBRE FAMILIA CON APELLIDOS DEL ALUMNO
  useEffect(() => {
    if (modo === 'nueva' && state.alumno.Apellidos) {
      form.setFieldsValue({ NombreFamilia: state.alumno.Apellidos.trim() });
    }
  }, [modo, state.alumno.Apellidos, form]);

  const handleCrear = async () => {
    try {
      form.setFieldsValue({ OtroTipo: 11 });
      const values = await form.validateFields();

      if (!values.PadreNombre && !values.MadreNombre && !values.OtroNombre) {
        message.error('Debe ingresar al menos un responsable');
        return;
      }

      if (values.PadreNombre && !values.PadreTipo) {
        message.error('Selecciona el tipo de responsable para el padre');
        return;
      }
      if (values.MadreNombre && !values.MadreTipo) {
        message.error('Selecciona el tipo de responsable para la madre');
        return;
      }

      if (!responsablePrincipal) {
        message.error('Selecciona un responsable principal');
        return;
      }

      // Obtener IdColaborador del localStorage
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      const IdColaborador = userFromStorage.IdUsuario;

      if (!IdColaborador) {
        console.error('ERROR: IdUsuario no existe o es null');
        message.error('No se detectó usuario. Recarga la página.');
        return;
      }

      console.log('ENVIANDO A BACKEND:', {
        NombreFamilia: values.NombreFamilia,
        IdColaborador: IdColaborador,
        DireccionRecibo: values.DireccionRecibo,
        NombreRecibo: values.NombreRecibo,
      });

      // PASO 1: CREAR USUARIO DE LA FAMILIA PRIMERO
      let IdUsuarioFamilia = null;
      let credencialesUsuario = null;

      try {
        // Generar nombre de usuario: NombreFamilia sin espacios (ej: RiveraEscobar)
        const nombreUsuarioFamilia = values.NombreFamilia.trim().replace(/\s+/g, '');

        // Generar contraseña aleatoria de 6 caracteres
        const contrasenaGenerada = generarContrasenaAleatoria();

        const usuarioFamiliaPayload = {
          NombreUsuario: nombreUsuarioFamilia,
          NombreCompleto: values.NombreFamilia,
          Contrasena: contrasenaGenerada,
          IdRol: 3, // Rol de familia
          IdColaborador: IdColaborador
        };

        console.log('=== CREANDO USUARIO FAMILIA ===');
        console.log('Payload:', usuarioFamiliaPayload);

        const usuarioFamiliaRes = await apiClient.post('/usuarios', usuarioFamiliaPayload);
        console.log('Response usuario familia:', usuarioFamiliaRes.data);

        // Capturar IdUsuario de la respuesta
        IdUsuarioFamilia = usuarioFamiliaRes.data.IdUsuario || usuarioFamiliaRes.data.data?.IdUsuario;
        console.log('✅ Usuario de la familia creado → IdUsuario:', IdUsuarioFamilia);

        // Guardar credenciales para generar PDF después
        credencialesUsuario = {
          nombreUsuario: nombreUsuarioFamilia,
          contrasena: contrasenaGenerada,
          nombreFamilia: values.NombreFamilia
        };

        message.success(`Usuario creado: ${nombreUsuarioFamilia}`);
      } catch (errorUsuario) {
        console.error('❌ Error al crear usuario de la familia:', errorUsuario);
        console.error('Response:', errorUsuario.response?.data);
        // Continuamos sin IdUsuario si falla
        message.warning('Error al crear usuario de la familia. Se creará la familia sin usuario.');
      }

      // PASO 2: CREAR FAMILIA CON EL IdUsuario
      const familiaRes = await apiClient.post('/familias', {
        NombreFamilia: values.NombreFamilia,
        Direccion: values.Direccion,
        TelefonoContacto: values.TelefonoContacto,
        EmailContacto: values.EmailContacto,
        IdColaborador: IdColaborador,
        NombreRecibo: values.NombreRecibo || null,
        DireccionRecibo: values.DireccionRecibo || null,
        IdUsuario: IdUsuarioFamilia, // Incluir el IdUsuario si se creó
      });

      const nuevaFamilia = familiaRes.data.data || familiaRes.data;
      console.log('✅ Familia creada con IdUsuario:', IdUsuarioFamilia);

      dispatch({
        type: 'UPDATE_PAGO',
        payload: {
          NombreRecibo: values.NombreRecibo || '',
          DireccionRecibo: values.DireccionRecibo || '',
        },
      });

      const crearResponsable = async (nombre, dpi, nit, tipo, esPrincipal) => {
        if (!nombre) return;
        await apiClient.post('/responsables', {
          NombreResponsable: nombre,
          DPI: dpi || null,
          NIT: nit || null,
          IdFamilia: nuevaFamilia.IdFamilia,
          IdResponsableTipo: tipo,
          EsResponsable: esPrincipal,
          IdColaborador: IdColaborador,
        });
      };

      await crearResponsable(
        values.PadreNombre,
        values.PadreDPI,
        values.PadreNIT,
        values.PadreTipo,
        responsablePrincipal === 'padre'
      );

      await crearResponsable(
        values.MadreNombre,
        values.MadreDPI,
        values.MadreNIT,
        values.MadreTipo,
        responsablePrincipal === 'madre'
      );
      // OTRO RESPONSABLE
      if (values.OtroNombre) {
        await crearResponsable(
          values.OtroNombre,
          values.OtroDPI,
          values.OtroNIT,
          11, // Tipo fijo: Otro
          responsablePrincipal === 'otro'
        );
      }
      message.success('Familia y responsables creados');

      // Generar PDF con las credenciales si se creó el usuario
      if (credencialesUsuario) {
        generarPDFCredenciales(
          credencialesUsuario.nombreUsuario,
          credencialesUsuario.contrasena,
          credencialesUsuario.nombreFamilia
        );
        message.info('PDF de credenciales descargado');
      }

      form.resetFields();
      setResponsablePrincipal(null);
      onSelect(nuevaFamilia);
      onCancel();
    } catch (error) {
      console.error('Error:', error);
      message.error('Error al crear familia');
    }
  };

  const handlePrincipalChange = (tipo) => {
    setResponsablePrincipal(prev => (prev === tipo ? null : tipo));
  };

  // Generar contraseña aleatoria de 6 caracteres (letras y números)
  const generarContrasenaAleatoria = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let contrasena = '';
    for (let i = 0; i < 6; i++) {
      contrasena += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return contrasena;
  };

  // Generar PDF con las credenciales
  const generarPDFCredenciales = (nombreUsuario, contrasena, nombreFamilia) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CREDENCIALES DE ACCESO', pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Académica', pageWidth / 2, 40, { align: 'center' });

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 50, pageWidth - 20, 50);

    // Información de la familia
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Familia:', 30, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(nombreFamilia, 30, 78);

    // Credenciales
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CREDENCIALES DE ACCESO:', 30, 100);

    // Nombre de usuario
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Nombre Usuario:', 30, 115);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(nombreUsuario, 30, 125);

    // Contraseña
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Contraseña:', 30, 145);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(contrasena, 30, 155);

    // Instrucciones
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('IMPORTANTE: Guarde estas credenciales en un lugar seguro.', 30, 180);
    doc.text('Podrá cambiar su contraseña después del primer ingreso.', 30, 188);

    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.text('Sistema de Gestión Académica', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-GT')}`, pageWidth / 2, footerY + 4, { align: 'center' });

    // Descargar PDF
    const fileName = `Credenciales_${nombreUsuario}.pdf`;
    doc.save(fileName);
  };

  return (
    <Modal title="Gestión de Familia" open={open} onCancel={onCancel} footer={null} width={1000}>
      <div style={{ marginBottom: 16 }}>
        <Button
          onClick={() => {
            setModo('buscar');
            form.resetFields();
            setResponsablePrincipal(null);
          }}
          type={modo === 'buscar' ? 'primary' : 'default'}
        >
          Buscar
        </Button>
        <Button
          onClick={() => {
            setModo('nueva');
            form.resetFields();
            setResponsablePrincipal(null);
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
                }
              });
              onSelect(fam);
            }
          }}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {familias.map((f) => (
            <Option
              key={f.IdFamilia}
              value={f.IdFamilia}
              label={`${f.NombreFamilia || 'Sin nombre'} - ${f.Direccion || 'Sin dirección'}`}
            >
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

          <div style={{ margin: '16px 0', fontWeight: 'bold', color: '#003366' }}>
            Datos para el Recibo (se pueden editar después)
          </div>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="NombreRecibo"
               label="DPI del Representante"
               rules={[{ required: true, message: 'El DPI es obligatorio' }]}>
                <Input placeholder="Ej: 1234567890101" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="DireccionRecibo"
               label="Dirección en el Recibo"
               rules={[{ required: true, message: 'La dirección es obligatoria' }]}>
                <Input placeholder="Ej: San Juan Ostuncalco" />
              </Form.Item>
            </Col>
          </Row>

        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>Responsables</div>
          {!showOtroResponsable && (
            <Button 
              size="small" 
              onClick={() => setShowOtroResponsable(true)}
              style={{ fontSize: 12 }}
            >
              Otro Responsable
            </Button>
          )}
        </div>
          <div style={{ margin: '16px 0', fontWeight: 'bold' }}>Responsables</div>

          {/* PADRE - CON shouldUpdate PARA REACTIVIDAD */}
          <Form.Item shouldUpdate={(prev, curr) => prev.PadreNombre !== curr.PadreNombre} noStyle>
            {({ getFieldValue }) => {
              const tieneNombrePadre = !!getFieldValue('PadreNombre');
              return (
                <Row gutter={16} align="middle">
                  <Col span={9}>
                    <Form.Item name="PadreNombre" label="Nombre del Padre">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="PadreDPI" label="DPI">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="PadreNIT" label="NIT">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item 
                      name="PadreTipo" 
                      label="Tipo"
                      rules={[{ required: tieneNombrePadre, message: 'Requerido' }]}
                    >
                      <Select placeholder="Tipo" allowClear>
                        {tiposResponsable.map((t, index) => (
                          <Option key={t.IdResponsableTipo ?? index} value={t.IdResponsableTipo}>
                            {t.Tipo}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={3} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                      checked={responsablePrincipal === 'padre'}
                      onChange={() => handlePrincipalChange('padre')}
                      disabled={!tieneNombrePadre}
                      style={{ marginTop: 28 }}
                    >
                      Principal
                    </Checkbox>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>

          {/* MADRE - CON shouldUpdate */}
          <Form.Item shouldUpdate={(prev, curr) => prev.MadreNombre !== curr.MadreNombre} noStyle>
            {({ getFieldValue }) => {
              const tieneNombreMadre = !!getFieldValue('MadreNombre');
              return (
                <Row gutter={16} align="middle">
                  <Col span={9}>
                    <Form.Item name="MadreNombre" label="Nombre de la Madre">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="MadreDPI" label="DPI">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item name="MadreNIT" label="NIT">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item 
                      name="MadreTipo" 
                      label="Tipo"
                      rules={[{ required: tieneNombreMadre, message: 'Requerido' }]}
                    >
                      <Select placeholder="Tipo" allowClear>
                        {tiposResponsable.map((t, index) => (
                          <Option key={t.IdResponsableTipo ?? index} value={t.IdResponsableTipo}>
                            {t.Tipo}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={3} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                      checked={responsablePrincipal === 'madre'}
                      onChange={() => handlePrincipalChange('madre')}
                      disabled={!tieneNombreMadre}
                      style={{ marginTop: 28 }}
                    >
                      Principal
                    </Checkbox>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>
              {/* OTRO RESPONSABLE - CONDICIONAL */}
          {showOtroResponsable && (
            <Form.Item shouldUpdate={(prev, curr) => prev.OtroNombre !== curr.OtroNombre} noStyle>
              {({ getFieldValue }) => {
                const tieneNombreOtro = !!getFieldValue('OtroNombre');
                return (
                  <Row gutter={16} align="middle" style={{ backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '6px', marginBottom: 16 }}>
                    <Col span={9}>
                      <Form.Item 
                        name="OtroNombre" 
                        label="Nombre del Otro Responsable"
                        rules={[{ required: showOtroResponsable, message: 'Requerido si se muestra' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="OtroDPI" label="DPI">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name="OtroNIT" label="NIT">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item label="Tipo">
                        <Input value="Otro" disabled style={{ backgroundColor: '#f5f5f5' }} />
                        {/* Campo oculto para enviar el ID 11 */}
                        <Form.Item name="OtroTipo" noStyle>
                          <Input type="hidden" />
                        </Form.Item>
                      </Form.Item>
                    </Col>
                    <Col span={3} style={{ display: 'flex', justifyContent: 'center' }}>
                      <Checkbox
                        checked={responsablePrincipal === 'otro'}
                        onChange={() => handlePrincipalChange('otro')}
                        disabled={!tieneNombreOtro}
                        style={{ marginTop: 28 }}
                      >
                        Principal
                      </Checkbox>
                    </Col>
                  </Row>
                );
              }}
            </Form.Item>
          )}
          <Button 
            type="primary" 
            onClick={handleCrear} 
            style={{ background: '#003366', borderColor: '#003366', marginTop: 16 }}
          >
            Crear Familia y Responsables
          </Button>
        </Form>
      )}
    </Modal>
  );
};

export default FamiliaModal;
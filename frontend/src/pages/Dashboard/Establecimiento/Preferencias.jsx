import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, message, Typography, Button, InputNumber, Spin, Row, Col, Divider } from 'antd';
import { DollarOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';

const { Title, Text } = Typography;

const Preferencias = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [grados, setGrados] = useState([]);

  // Los 4 niveles son fijos
  const niveles = [
    { IdNivel: 1, NombreNivel: 'Pre Primaria', color: '#ff6b6b' },
    { IdNivel: 2, NombreNivel: 'Primaria', color: '#4ecdc4' },
    { IdNivel: 3, NombreNivel: 'Medio', color: '#45b7d1' },
    { IdNivel: 4, NombreNivel: 'Diversificado', color: '#f7b731' },
  ];

  // Estado para los precios editables de cada nivel
  const [precios, setPrecios] = useState({
    1: { Mensualidad: 0, ValorInscripcion: 0 },
    2: { Mensualidad: 0, ValorInscripcion: 0 },
    3: { Mensualidad: 0, ValorInscripcion: 0 },
    4: { Mensualidad: 0, ValorInscripcion: 0 },
  });

  useEffect(() => {
    cargarGrados();
  }, []);

  const cargarGrados = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/grados');

      let gradosData = [];

      // Manejar diferentes formatos de respuesta
      if (res.data.success && res.data.data) {
        gradosData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
      } else if (Array.isArray(res.data)) {
        gradosData = res.data;
      }

      setGrados(gradosData);

      // Inicializar precios con los valores actuales de los grados
      const preciosIniciales = {};
      niveles.forEach(nivel => {
        const gradosDelNivel = gradosData.filter(g => g.IdNivel === nivel.IdNivel);
        if (gradosDelNivel.length > 0) {
          // Tomar los valores del primer grado (todos deberían tener los mismos)
          preciosIniciales[nivel.IdNivel] = {
            Mensualidad: parseFloat(gradosDelNivel[0].Mensualidad || 0),
            ValorInscripcion: parseFloat(gradosDelNivel[0].ValorInscripcion || 0),
          };
        } else {
          preciosIniciales[nivel.IdNivel] = { Mensualidad: 0, ValorInscripcion: 0 };
        }
      });

      setPrecios(preciosIniciales);
      message.success('Datos cargados correctamente');
    } catch (err) {
      console.error('Error al cargar grados:', err);
      message.error('Error al cargar los grados');
    } finally {
      setLoading(false);
    }
  };

  const actualizarPreciosNivel = async (idNivel) => {
    const nivel = niveles.find(n => n.IdNivel === idNivel);
    if (!nivel) return;

    const { Mensualidad, ValorInscripcion } = precios[idNivel];

    if (!Mensualidad || Mensualidad <= 0) {
      message.warning('Por favor ingresa un monto válido para la mensualidad');
      return;
    }

    if (!ValorInscripcion || ValorInscripcion <= 0) {
      message.warning('Por favor ingresa un monto válido para la inscripción');
      return;
    }

    setGuardando(true);

    try {
      // Obtener grados de este nivel
      const gradosDelNivel = grados.filter(g => g.IdNivel === idNivel);

      if (gradosDelNivel.length === 0) {
        message.warning(`No hay grados registrados para el nivel ${nivel.NombreNivel}`);
        setGuardando(false);
        return;
      }

      // Obtener IdColaborador del usuario en localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const IdColaborador = user.IdUsuario;

      // Actualizar cada grado del nivel
      const promesas = gradosDelNivel.map(grado =>
        apiClient.put(`/grados/${grado.IdGrado}`, {
          NombreGrado: grado.NombreGrado,
          IdNivel: grado.IdNivel,
          Mensualidad: Mensualidad,
          ValorInscripcion: ValorInscripcion,
          Estado: grado.Estado,
          IdColaborador: IdColaborador
        })
      );

      await Promise.all(promesas);

      message.success(`Precios actualizados para ${nivel.NombreNivel} (${gradosDelNivel.length} grado${gradosDelNivel.length > 1 ? 's' : ''} actualizado${gradosDelNivel.length > 1 ? 's' : ''})`);

      // Recargar los grados para reflejar los cambios
      await cargarGrados();
    } catch (err) {
      console.error('Error al actualizar precios:', err);
      message.error('Error al actualizar los precios');
    } finally {
      setGuardando(false);
    }
  };

  const handlePrecioChange = (idNivel, campo, valor) => {
    setPrecios(prev => ({
      ...prev,
      [idNivel]: {
        ...prev[idNivel],
        [campo]: valor
      }
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Cargando preferencias...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <DollarOutlined /> Preferencias del Sistema
      </Title>
      <Title level={5} type="secondary">
        Configuración de precios de mensualidad e inscripción por nivel académico
      </Title>

      <Divider />

      <Row gutter={[24, 24]}>
        {niveles.map(nivel => {
          const gradosDelNivel = grados.filter(g => g.IdNivel === nivel.IdNivel);
          const cantidadGrados = gradosDelNivel.length;

          return (
            <Col xs={24} md={12} key={nivel.IdNivel}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: nivel.color
                      }}
                    />
                    <span style={{ fontSize: 18, fontWeight: 'bold' }}>
                      {nivel.NombreNivel}
                    </span>
                  </div>
                }
                extra={
                  <Text type="secondary">
                    {cantidadGrados} grado{cantidadGrados !== 1 ? 's' : ''}
                  </Text>
                }
                style={{
                  borderTop: `4px solid ${nivel.color}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Mensualidad (Q)
                  </Text>
                  <InputNumber
                    value={precios[nivel.IdNivel].Mensualidad}
                    onChange={(val) => handlePrecioChange(nivel.IdNivel, 'Mensualidad', val)}
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    size="large"
                    prefix="Q"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/Q\s?|(,*)/g, '')}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Inscripción (Q)
                  </Text>
                  <InputNumber
                    value={precios[nivel.IdNivel].ValorInscripcion}
                    onChange={(val) => handlePrecioChange(nivel.IdNivel, 'ValorInscripcion', val)}
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    size="large"
                    prefix="Q"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/Q\s?|(,*)/g, '')}
                  />
                </div>

                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => actualizarPreciosNivel(nivel.IdNivel)}
                  loading={guardando}
                  block
                  size="large"
                  style={{ backgroundColor: nivel.color, borderColor: nivel.color }}
                >
                  Guardar Precios de {nivel.NombreNivel}
                </Button>

                {gradosDelNivel.length > 0 && (
                  <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <strong>Grados incluidos:</strong> {gradosDelNivel.map(g => g.NombreGrado).join(', ')}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      <Divider />

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={cargarGrados}
          loading={loading}
          size="large"
          style={{ marginRight: 16 }}
        >
          Recargar Datos
        </Button>
        <Button
          size="large"
          onClick={() => navigate('/dashboard')}
        >
          Regresar al Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Preferencias;

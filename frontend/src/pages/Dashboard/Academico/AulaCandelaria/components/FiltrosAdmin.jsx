import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, message } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../../../../../api/apiClient';
import { getCicloActual } from '../../../../../utils/cicloEscolar';

const { Option } = Select;

const FiltrosAdmin = ({ filtros, onFiltrosChange }) => {
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [jornadas, setJornadas] = useState([]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [gradosRes, seccionesRes, jornadasRes] = await Promise.all([
        apiClient.get('/grados'),
        apiClient.get('/secciones'),
        apiClient.get('/jornadas')
      ]);

      // Manejar respuestas con diferentes formatos
      if (gradosRes.data.success) {
        setGrados(gradosRes.data.data);
      } else if (Array.isArray(gradosRes.data)) {
        setGrados(gradosRes.data);
      }

      if (Array.isArray(seccionesRes.data)) {
        setSecciones(seccionesRes.data);
      } else if (seccionesRes.data.success) {
        setSecciones(seccionesRes.data.data);
      }

      if (Array.isArray(jornadasRes.data)) {
        setJornadas(jornadasRes.data);
      } else if (jornadasRes.data.success) {
        setJornadas(jornadasRes.data.data);
      }

      console.log('✅ Catálogos cargados para filtros admin');
    } catch (error) {
      console.error('❌ Error al cargar catálogos:', error);
      message.error('Error al cargar filtros');
    }
  };

  const handleChange = (field, value) => {
    const nuevosFiltros = { ...filtros, [field]: value };
    onFiltrosChange(nuevosFiltros);
  };

  const handleLimpiar = () => {
    const filtrosLimpios = {
      anio: getCicloActual(),
      idGrado: null,
      idSeccion: null,
      idJornada: null
    };
    onFiltrosChange(filtrosLimpios);
  };

  return (
    <Card
      size="small"
      title={
        <span>
          <FilterOutlined /> Filtros de Búsqueda
        </span>
      }
      extra={
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={handleLimpiar}
        >
          Limpiar
        </Button>
      }
      style={{ marginBottom: '24px' }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '13px', fontWeight: 500 }}>
            Año Escolar:
          </label>
          <Select
            style={{ width: '100%' }}
            value={filtros.anio}
            onChange={(value) => handleChange('anio', value)}
          >
            {[2024, 2025, 2026, 2027, 2028].map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '13px', fontWeight: 500 }}>
            Grado:
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Todos los grados"
            value={filtros.idGrado}
            onChange={(value) => handleChange('idGrado', value)}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {grados.map(grado => (
              <Option key={grado.IdGrado} value={grado.IdGrado}>
                {grado.NombreGrado}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '13px', fontWeight: 500 }}>
            Sección:
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Todas las secciones"
            value={filtros.idSeccion}
            onChange={(value) => handleChange('idSeccion', value)}
            allowClear
          >
            {secciones.map(seccion => (
              <Option key={seccion.IdSeccion} value={seccion.IdSeccion}>
                {seccion.NombreSeccion}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '13px', fontWeight: 500 }}>
            Jornada:
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="Todas las jornadas"
            value={filtros.idJornada}
            onChange={(value) => handleChange('idJornada', value)}
            allowClear
          >
            {jornadas.map(jornada => (
              <Option key={jornada.IdJornada} value={jornada.IdJornada}>
                {jornada.NombreJornada}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Card>
  );
};

export default FiltrosAdmin;

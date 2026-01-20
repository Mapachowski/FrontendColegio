import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, BookOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import CrearCursoModal from './components/CrearCursoModal';
import EditarCursoModal from './components/EditarCursoModal';
import VerCursoModal from './components/VerCursoModal';
import { registrarBitacora } from '../../../utils/bitacora';

const { Option } = Select;

const Cursos = () => {
  const [cursos, setCursos] = useState([]);
  const [grados, setGrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [filtroGrado, setFiltroGrado] = useState(null);

  useEffect(() => {
    cargarGrados();
    cargarCursos();
  }, []);

  const cargarGrados = async () => {
    try {
      const response = await apiClient.get('/grados');
      if (response.data.success) {
        setGrados(response.data.data);
      }
    } catch (error) {
      message.error('Error al cargar la lista de grados');
    }
  };

  const cargarCursos = async (idGrado = null) => {
    setLoading(true);
    try {
      const url = idGrado ? `/cursos/grado/${idGrado}` : '/cursos';
      const response = await apiClient.get(url);
      if (response.data.success) {
        setCursos(response.data.data);
      }
    } catch (error) {
      message.error('Error al cargar la lista de cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (idCurso, nombreCurso = '') => {
    try {
      const response = await apiClient.delete(`/cursos/${idCurso}`);
      if (response.data.success) {
        // Registrar en bitácora
        await registrarBitacora(
          'Eliminación de Curso',
          `Curso ID: ${idCurso}${nombreCurso ? ` - ${nombreCurso}` : ''}`
        );

        message.success('Curso eliminado exitosamente');
        cargarCursos(filtroGrado);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error al eliminar curso');
    }
  };

  const handleFiltroGrado = (value) => {
    setFiltroGrado(value);
    cargarCursos(value);
  };

  const abrirModalVer = (curso) => {
    setCursoSeleccionado(curso);
    setModalVerVisible(true);
  };

  const abrirModalEditar = (curso) => {
    setCursoSeleccionado(curso);
    setModalEditarVisible(true);
  };

  const getNombreGrado = (idGrado, cursoGrado = null) => {
    // Si el curso ya tiene el objeto Grado incluido, usarlo
    if (cursoGrado && cursoGrado.NombreGrado) {
      return cursoGrado.NombreGrado;
    }
    // Si no, buscar en el array de grados
    const grado = grados.find(g => g.IdGrado === idGrado);
    return grado ? grado.NombreGrado : 'N/A';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'idCurso',
      key: 'idCurso',
      width: 70,
      sorter: (a, b) => a.idCurso - b.idCurso,
    },
    {
      title: 'Grado',
      dataIndex: 'idGrado',
      key: 'idGrado',
      width: 200,
      render: (idGrado, record) => getNombreGrado(idGrado, record.Grado),
      sorter: (a, b) => a.idGrado - b.idGrado,
    },
    {
      title: 'Orden',
      dataIndex: 'NoOrden',
      key: 'NoOrden',
      width: 100,
      sorter: (a, b) => a.NoOrden - b.NoOrden,
    },
    {
      title: 'Nombre del Curso',
      dataIndex: 'Curso',
      key: 'Curso',
      sorter: (a, b) => a.Curso.localeCompare(b.Curso),
    },
    {
      title: 'Código SIRE',
      dataIndex: 'CodigoSire',
      key: 'CodigoSire',
      width: 150,
    },
    {
      title: 'Estado',
      dataIndex: 'Estado',
      key: 'Estado',
      width: 100,
      render: (estado) => (
        <Tag color={estado ? 'green' : 'red'}>
          {estado ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => abrirModalVer(record)}
            title="Ver detalles"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => abrirModalEditar(record)}
            title="Editar"
          />
          <Popconfirm
            title="¿Está seguro de eliminar este curso?"
            description="Esta acción desactivará el curso en el sistema."
            onConfirm={() => handleEliminar(record.idCurso, record.Curso)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              title="Eliminar"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          <BookOutlined /> Gestión de Cursos
        </h2>
        <Space>
          <Select
            placeholder="Filtrar por grado"
            style={{ width: 200 }}
            allowClear
            onChange={handleFiltroGrado}
            value={filtroGrado}
          >
            {grados.map(grado => (
              <Option key={grado.IdGrado} value={grado.IdGrado}>
                {grado.NombreGrado}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalCrearVisible(true)}
            size="large"
          >
            Nuevo Curso
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={cursos}
        rowKey="idCurso"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} cursos`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        bordered
        scroll={{ x: 1200 }}
      />

      {/* Modal Crear */}
      <CrearCursoModal
        visible={modalCrearVisible}
        grados={grados}
        onCancel={() => setModalCrearVisible(false)}
        onSuccess={() => {
          setModalCrearVisible(false);
          cargarCursos(filtroGrado);
        }}
      />

      {/* Modal Editar */}
      <EditarCursoModal
        visible={modalEditarVisible}
        curso={cursoSeleccionado}
        grados={grados}
        onCancel={() => {
          setModalEditarVisible(false);
          setCursoSeleccionado(null);
        }}
        onSuccess={() => {
          setModalEditarVisible(false);
          setCursoSeleccionado(null);
          cargarCursos(filtroGrado);
        }}
      />

      {/* Modal Ver */}
      <VerCursoModal
        visible={modalVerVisible}
        curso={cursoSeleccionado}
        grados={grados}
        onCancel={() => {
          setModalVerVisible(false);
          setCursoSeleccionado(null);
        }}
      />
    </div>
  );
};

export default Cursos;

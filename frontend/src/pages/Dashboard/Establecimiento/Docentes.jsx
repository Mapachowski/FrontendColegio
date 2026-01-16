import React, { useState, useEffect } from 'react';
import { Table, Button, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import CrearDocenteModal from './components/CrearDocenteModal';
import EditarDocenteModal from './components/EditarDocenteModal';
import VerDocenteModal from './components/VerDocenteModal';
import { registrarBitacora } from '../../../utils/bitacora';

const Docentes = () => {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [modalVerVisible, setModalVerVisible] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);

  useEffect(() => {
    cargarDocentes();
  }, []);

  const cargarDocentes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/docentes');
      if (response.data.success) {
        setDocentes(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar docentes:', error);
      message.error('Error al cargar la lista de docentes');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (idDocente, nombreDocente = '') => {
    try {
      const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };
      const IdUsuario = user.IdUsuario;
      const response = await apiClient.delete(`/docentes/${idDocente}`, {
        data: { ModificadoPor: String(IdUsuario) } // Convertir a string para evitar error .trim()
      });
      if (response.data.success) {
        // Registrar en bitácora
        await registrarBitacora(
          'Eliminación de Docente',
          `Docente ID: ${idDocente}${nombreDocente ? ` - ${nombreDocente}` : ''}`
        );

        message.success('Docente eliminado exitosamente');
        cargarDocentes();
      }
    } catch (error) {
      console.error('Error al eliminar docente:', error);
      message.error(error.response?.data?.message || 'Error al eliminar docente');
    }
  };

  const abrirModalVer = (docente) => {
    setDocenteSeleccionado(docente);
    setModalVerVisible(true);
  };

  const abrirModalEditar = (docente) => {
    setDocenteSeleccionado(docente);
    setModalEditarVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'idDocente',
      key: 'idDocente',
      width: 70,
      sorter: (a, b) => a.idDocente - b.idDocente,
    },
    {
      title: 'Nombre del Docente',
      dataIndex: 'NombreDocente',
      key: 'NombreDocente',
      sorter: (a, b) => a.NombreDocente.localeCompare(b.NombreDocente),
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
      ellipsis: true,
    },
    {
      title: 'Teléfono',
      dataIndex: 'Telefono',
      key: 'Telefono',
      width: 120,
    },
    {
      title: 'Especialidad',
      dataIndex: 'Especialidad',
      key: 'Especialidad',
      ellipsis: true,
    },
    {
      title: 'Usuario',
      key: 'NombreUsuario',
      width: 130,
      render: (_, record) => record.Usuario?.NombreUsuario || 'Sin usuario',
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
            title="¿Está seguro de eliminar este docente?"
            description="Esta acción desactivará al docente en el sistema."
            onConfirm={() => handleEliminar(record.idDocente, `${record.Nombres} ${record.Apellidos}`)}
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
          <UserOutlined /> Gestión de Docentes
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalCrearVisible(true)}
          size="large"
        >
          Nuevo Docente
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={docentes}
        rowKey="idDocente"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} docentes`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        bordered
        scroll={{ x: 1200 }}
      />

      {/* Modal Crear */}
      <CrearDocenteModal
        visible={modalCrearVisible}
        onCancel={() => setModalCrearVisible(false)}
        onSuccess={() => {
          setModalCrearVisible(false);
          cargarDocentes();
        }}
      />

      {/* Modal Editar */}
      <EditarDocenteModal
        visible={modalEditarVisible}
        docente={docenteSeleccionado}
        onCancel={() => {
          setModalEditarVisible(false);
          setDocenteSeleccionado(null);
        }}
        onSuccess={() => {
          setModalEditarVisible(false);
          setDocenteSeleccionado(null);
          cargarDocentes();
        }}
      />

      {/* Modal Ver */}
      <VerDocenteModal
        visible={modalVerVisible}
        docente={docenteSeleccionado}
        onCancel={() => {
          setModalVerVisible(false);
          setDocenteSeleccionado(null);
        }}
      />
    </div>
  );
};

export default Docentes;

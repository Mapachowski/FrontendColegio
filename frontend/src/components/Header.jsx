import React, { useState, useEffect } from 'react';
import { Layout, Dropdown, Menu, Modal, Form, Input, message, Avatar } from 'antd';
import { UserOutlined, BellOutlined, LogoutOutlined, LockOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';

const { Header } = Layout;

const HeaderComponent = () => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState({}); // { 1: 'Administrador', 2: 'Operador', ... }
  const [notifications] = useState([
    { id: 1, title: 'Nueva tarea', message: 'Tarea asignada por maestro', date: '2025-10-11' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Cargar usuario y roles
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser({
        id: parsed.IdUsuario,
        nombreUsuario: parsed.NombreUsuario,
        nombreCompleto: parsed.NombreCompleto || 'Sin nombre completo',
        rol: parsed.rol || parsed.IdRol
      });
    }

    // Cargar roles desde API
    const fetchRoles = async () => {
      try {
        const res = await apiClient.get('/roles');
        if (res.data.success) {
          const rolesMap = {};
          res.data.data.forEach(r => {
            rolesMap[r.IdRol] = r.NombreRol;
          });
          setRoles(rolesMap);
        }
      } catch (error) {
      }
    };

    fetchRoles();
  }, []);

  if (!user) {
    return (
      <Header style={{ background: '#001f3f', color: '#fff', textAlign: 'right', padding: '0 24px' }}>
        Cargando...
      </Header>
    );
  }

  const idUsuario = user.id;
  const rolColores = {
    1: '#ff4d4f', // Administrador: rojo
    2: '#1890ff', // Operador: azul
    3: '#52c41a', // Familia: verde
    4: '#fa8c16', // Docente: naranja
  };

  const colorRol = rolColores[user.rol] || '#8c8c8c';
  // Cambio de contraseña
  const handleChangePassword = async (values) => {
    try {
      const payload = {
        Contrasena: values.newPassword,
        ContrasenaActual: values.currentPassword,
        IdColaborador: idUsuario
      };
      const response = await apiClient.put(`/usuarios/${encodeURIComponent(idUsuario)}`, payload);
      if (response.data.success) {
        message.success('Contraseña cambiada exitosamente');
        handleCancel();
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Error al cambiar contraseña';
      message.error(msg);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const notificationMenu = (
    <Menu>
      {notifications.length > 0 ? (
        notifications.map((notif) => (
          <Menu.Item key={notif.id}>
            <div>
              <strong>{notif.title}</strong>
              <p style={{ margin: '4px 0', fontSize: 12 }}>{notif.message}</p>
              <small>{notif.date}</small>
            </div>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item key="0">No hay notificaciones</Menu.Item>
      )}
    </Menu>
  );

  const userMenu = (
    <Menu style={{ width: 280, padding: '12px 0' }}>
      <div style={{ padding: '0 16px 12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Avatar size={60} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1a1a1a' }}>
            {user.nombreUsuario}
          </div>
          <div style={{ color: '#595959', fontSize: 13, margin: '4px 0' }}>
            {user.nombreCompleto}
          </div>
          <div style={{ color: colorRol, fontSize: 13, fontWeight: 600 }}>
            {roles[user.rol] || 'Cargando rol...'}
          </div>
        </div>
      </div>

      <Menu.Item key="change-password" icon={<LockOutlined />} onClick={() => setIsModalOpen(true)}>
        Cambiar contraseña
      </Menu.Item>

      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} danger>
        Cerrar sesión
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Header style={{
        padding: '0 24px',
        background: '#001f3f',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        color: '#fff',
        height: 64,
        lineHeight: '64px'
      }}>
        <Dropdown overlay={notificationMenu} trigger={['click']}>
          <BellOutlined style={{ fontSize: 20, cursor: 'pointer', marginRight: 24, color: '#fff' }} />
        </Dropdown>

        <LogoutOutlined
          style={{ fontSize: 20, cursor: 'pointer', marginRight: 24, color: '#fff' }}
          onClick={handleLogout}
          title="Cerrar sesión"
        />

        <Dropdown overlay={userMenu} trigger={['click']}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <span style={{ marginRight: 8, color: '#fff', fontWeight: 500 }}>
              {user.nombreUsuario}
            </span>
            <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          </div>
        </Dropdown>
      </Header>

      {/* Modal Cambiar Contraseña */}
      <Modal
        title="Cambiar Contraseña"
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        okText="Cambiar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item name="currentPassword" label="Contraseña Actual" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="Nueva Contraseña" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirmar Nueva Contraseña"
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default HeaderComponent;
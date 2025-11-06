import React, { useState } from 'react';
import { Layout, Dropdown, Menu } from 'antd';
import { UserOutlined, BellOutlined } from '@ant-design/icons';

const { Header } = Layout;

const HeaderComponent = ({ user }) => {
  const [notifications] = useState([
    { id: 1, title: 'Nueva tarea', message: 'Tarea asignada por maestro', date: '2025-10-11' },
    // Más desde API si tienes
  ]);

  const notificationMenu = (
    <Menu>
      {notifications.length > 0 ? (
        notifications.map((notif) => (
          <Menu.Item key={notif.id}>
            <div>
              <h4>{notif.title}</h4>
              <p>{notif.message}</p>
              <small>{notif.date}</small>
            </div>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item key="0">No hay notificaciones</Menu.Item>
      )}
    </Menu>
  );

  return (
    <Header style={{ padding: '0 20px', background: '#001f3f', display: 'flex', justifyContent: 'flex-end', color: '#fff' }}>
      <Dropdown overlay={notificationMenu} trigger={['click']}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer', marginLeft: 15, color: '#fff' }} />
      </Dropdown>
      <span style={{ marginLeft: 15, color: '#fff' }}>
        {user.nombre} ({user.rol === 1 ? 'Administrador' : user.rol === 2 ? 'Secretaria/Contador' : user.rol === 3 ? 'Maestro' : 'Alumno'})
      </span>
      <UserOutlined style={{ fontSize: 24, marginLeft: 15, color: '#fff' }} />
    </Header>
  );
};

export default HeaderComponent;
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge } from 'antd';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import {
  SettingOutlined,
  UserOutlined,
  BookOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  ToolOutlined,
  DesktopOutlined,
  UserAddOutlined,
  EditOutlined,
  UnorderedListOutlined,
  UserDeleteOutlined,
  IdcardOutlined,
  TeamOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  TableOutlined,
  UnlockOutlined,
  LockOutlined,
  SwapOutlined,
  WalletOutlined,
  ExclamationCircleOutlined,
  FundViewOutlined,
  HistoryOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ user }) => {
  const [openKeys, setOpenKeys] = useState(['1']);
  const [pendientesSolicitudes, setPendientesSolicitudes] = useState(0);

  useEffect(() => {
    // Solo cargar solicitudes pendientes para administradores y operadores
    if (user.rol === 1 || user.rol === 2) {
      cargarSolicitudesPendientes();
      // Actualizar cada 2 minutos
      const interval = setInterval(cargarSolicitudesPendientes, 120000);
      return () => clearInterval(interval);
    }
  }, [user.rol]);

  const cargarSolicitudesPendientes = async () => {
    try {
      const response = await apiClient.get('/solicitudes-reapertura/pendientes');
      if (response.data.success) {
        const pendientes = response.data.data.filter(s => s.Estado === 'pendiente').length;
        setPendientesSolicitudes(pendientes);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes pendientes:', error);
      // Si falla, establecer en 0 para evitar problemas de renderizado
      setPendientesSolicitudes(0);
    }
  };

  const onOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (latestOpenKey) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys([]);
    }
  };

  const menuItems = [
    {
      key: '1',
      icon: <SettingOutlined />,
      label: 'Establecimiento',
      children: [
        { key: '1-1', label: 'Preferencias', path: '/dashboard/preferencias', icon: <ToolOutlined /> },
        { key: '1-2', label: 'Uso de Plataforma', path: '/dashboard/uso-plataforma', icon: <DesktopOutlined /> },
        { key: '1-3', label: 'Credenciales de acceso Docente', path: '/dashboard/establecimiento/credenciales-docente', icon: <IdcardOutlined /> },
        { key: '1-4', label: 'Docentes', path: '/dashboard/establecimiento/docentes', icon: <TeamOutlined /> },
        { key: '1-5', label: 'Cursos', path: '/dashboard/establecimiento/cursos', icon: <BookOutlined /> },
        { key: '1-6', label: 'Solicitudes de Reapertura', path: '/dashboard/administrador/gestionar-solicitudes-reapertura', icon: <UnlockOutlined />, badge: pendientesSolicitudes },
        { key: '1-7', label: 'Cierre de Unidades', path: '/dashboard/administrador/cierre-unidades', icon: <LockOutlined /> },
      ],
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: 'Estudiantes',
      children: [
        { key: '2-1', label: 'Inscribir Estudiante', path: '/dashboard/inscripciones/inscripciones', icon: <UserAddOutlined /> },
        { key: '2-2', label: 'Modificar Estudiante', path: '/dashboard/alumnos/editar', icon: <EditOutlined /> },
        { key: '2-3', label: 'Listados Estudiantes', path: '/dashboard/alumnos/listado', icon: <UnorderedListOutlined /> },
        { key: '2-4', label: 'Estudiantes Retirados', path: '/dashboard/alumnos/estudiantes-retirados', icon: <UserDeleteOutlined /> },
        { key: '2-5', label: 'Credenciales de Acceso', path: '/dashboard/estudiantes/credenciales-acceso', icon: <IdcardOutlined /> },
        { key: '2-6', label: 'Listado Padres de Familia', path: '/dashboard/alumnos/listado-responsables', icon: <TeamOutlined /> },
        // { key: '2-7', label: 'Exportar Información', path: '/exportar-informacion', icon: <DownloadOutlined /> }, // Ocultado temporalmente
      ].filter(Boolean),
    },
    {
      key: '3',
      icon: <BookOutlined />,
      label: 'Académico',
      children: [
        { key: '3-1', label: 'Aula Candelaria', path: '/dashboard/academico/aula-candelaria', icon: <BookOutlined /> },
        { key: '3-2', label: 'Calendario Tareas', path: '/dashboard/academico/calendario-tareas', icon: <CalendarOutlined /> },
        { key: '3-3', label: 'Configurar Unidades', path: '/dashboard/configurar-academico/configurar-unidades', icon: <UnorderedListOutlined /> },
        { key: '3-4', label: 'Configurar Actividades', path: '/dashboard/configurar-academico/configurar-actividades', icon: <CalendarOutlined /> },
        { key: '3-5', label: 'Mis Solicitudes Reapertura', path: '/dashboard/configurar-academico/mis-solicitudes-reapertura', icon: <UnlockOutlined /> },
      ],
    },
    {
      key: '4',
      icon: <FileTextOutlined />,
      label: 'Informes Académicos',
      children: [
        { key: '4-1', label: 'Boletas de Calificaciones', path: '/dashboard/administrador/boleta-calificaciones', icon: <FilePdfOutlined /> },
        { key: '4-3', label: 'Detalle Calificaciones', path: '/detalle-calificaciones', icon: <TableOutlined /> },
        { key: '4-5', label: 'Promedios', path: '/promedios', icon: <BarChartOutlined /> },
      ].filter(Boolean),
    },
    {
      key: '5',
      icon: <SettingOutlined />,
      label: 'Configurar Académico',
      children: [
        { key: '5-3', label: 'Asignación de Cursos', path: '/dashboard/configurar-academico/asignacion-cursos', icon: <SwapOutlined /> },
        { key: '5-4', label: 'Configurar Unidades', path: '/dashboard/configurar-academico/configurar-unidades', icon: <UnorderedListOutlined /> },
        { key: '5-5', label: 'Configurar Actividades', path: '/dashboard/configurar-academico/configurar-actividades', icon: <CalendarOutlined /> },
      ].filter(Boolean),
    },
    {
      key: '6',
      icon: <DollarOutlined />,
      label: 'Pagos',
      children: [
        { key: '6-1', label: 'Ingreso de Pagos', path: '/dashboard/pagos/crear', icon: <WalletOutlined /> },
        { key: '6-2', label: 'Buscar Recibo', path: '/dashboard/pagos/buscar-recibo', icon: <FileSearchOutlined /> },
        { key: '6-6', label: 'Insolventes', path: '/dashboard/pagos/insolventes', icon: <ExclamationCircleOutlined /> },
      ].filter(Boolean),
    },
    {
      key: '7',
      icon: <BarChartOutlined />,
      label: 'Informes Financieros',
      children: [
        { key: '7-1', label: 'Informe Diario Ingresos', path: '/dashboard/pagos/pagos-hoy', icon: <FundViewOutlined /> },
        { key: '7-2', label: 'Historial Pagos', path: '/dashboard/pagos/reporte-fechas', icon: <HistoryOutlined /> },
      ],
    },
    {
      key: '8',
      icon: <FileTextOutlined />,
      label: 'Mis Hijos',
      children: [
        { key: '8-1', label: 'Calificaciones', path: '/dashboard/estudiantes/mis-calificaciones', icon: <FilePdfOutlined /> },
        { key: '8-2', label: 'Actividades por Curso', path: '/dashboard/estudiantes/mis-actividades', icon: <BookOutlined /> },
      ],
    },
  ].map((item) => {
    // Administrador (rol 1): ve todo
    if (user.rol === 1) return item;

    // Operador (rol 2): Estudiantes, Pagos, Académico, Informes Académicos, Configurar Académico
    if (user.rol === 2) {
      if (['2', '3', '4', '5', '6'].includes(item.key)) {
        return item;
      }
      return null;
    }

    // Familia (rol 3): solo ve el menú "Mis Hijos"
    if (user.rol === 3) {
      if (item.key === '8') {
        return item; // Menú "Mis Hijos" con calificaciones
      }
      return null;
    }

    // Docente (rol 4): acceso completo a Académico e Informes Académicos
    if (user.rol === 4) {
      if (['3', '4'].includes(item.key)) {
        return item;
      }
      return null;
    }

    // Alumno (rol 5): solo Académico e Informes Académicos (completos)
    if (user.rol === 5) {
      if (['3', '4'].includes(item.key)) {
        return item;
      }
      return null;
    }

    return null;
  })
  .filter(Boolean); // Elimina elementos null

  // Personalizar ítems del menú con íconos solo en la etiqueta
const customizedMenuItems = menuItems.map((item) => ({
  ...item,
  label: <Link to={item.path || '#'}>{item.label}</Link>,
  children: item.children?.map((child) => ({
    key: child.key,
    label: (
      <Link to={child.path}>
        {child.icon} {child.label}
        {child.badge > 0 && (
          <Badge
            count={child.badge}
            style={{ marginLeft: 8 }}
            overflowCount={99}
          />
        )}
      </Link>
    ),
    icon: null,
  })),
}));

  return (
    <Sider width={250} style={{ background: '#001f3f', height: '100vh', position: 'fixed', color: '#fff' }}>
      <Menu
        mode="inline"
        defaultSelectedKeys={['1']}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        style={{ background: '#001f3f', color: '#fff', borderRight: 0, height: '100%' }}
        items={customizedMenuItems}
      />
    </Sider>
  );
};

export default Sidebar;
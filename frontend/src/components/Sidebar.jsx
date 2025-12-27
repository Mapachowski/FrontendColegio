import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';
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
  DownloadOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  TableOutlined,
  UserSwitchOutlined,
  PlusSquareOutlined,
  AppstoreAddOutlined,
  SwapOutlined,
  WalletOutlined,
  SettingFilled,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  FundViewOutlined,
  HistoryOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = ({ user }) => {
  const [openKeys, setOpenKeys] = useState(['1']);

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
        { key: '1-2', label: 'Uso de Plataforma', path: '/uso-plataforma', icon: <DesktopOutlined /> },
        { key: '1-3', label: 'Credenciales de acceso Docente', path: '/dashboard/establecimiento/credenciales-docente', icon: <IdcardOutlined /> },
        { key: '1-4', label: 'Docentes', path: '/dashboard/establecimiento/docentes', icon: <TeamOutlined /> },
        { key: '1-5', label: 'Cursos', path: '/dashboard/establecimiento/cursos', icon: <BookOutlined /> },
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
        { key: '2-7', label: 'Exportar Información', path: '/exportar-informacion', icon: <DownloadOutlined /> },
      ],
    },
    {
      key: '3',
      icon: <BookOutlined />,
      label: 'Académico',
      children: [
        { key: '3-1', label: 'Aula Candelaria', path: '/dashboard/academico/aula-candelaria', icon: <BookOutlined /> },
        { key: '3-2', label: 'Calendario de Tareas', path: '/dashboard/academico/calendario-tareas', icon: <CalendarOutlined /> },
      ],
    },
    {
      key: '4',
      icon: <FileTextOutlined />,
      label: 'Informes Académicos',
      children: [
        { key: '4-1', label: 'Boletas de Calificaciones', path: '/boletas-calificaciones', icon: <FilePdfOutlined /> },
        { key: '4-3', label: 'Detalle Calificaciones', path: '/detalle-calificaciones', icon: <TableOutlined /> },
        { key: '4-5', label: 'Promedios', path: '/promedios', icon: <BarChartOutlined /> },
        { key: '4-7', label: 'Maestros Asignados', path: '/maestros-asignados', icon: <UserSwitchOutlined /> },
      ],
    },
    {
      key: '5',
      icon: <SettingOutlined />,
      label: 'Configurar Académico',
      children: [
        { key: '5-1', label: 'Tipos de Actividades', path: '/tipos-actividades', icon: <PlusSquareOutlined /> },
        { key: '5-2', label: 'Administrar Cursos', path: '/administrar-cursos', icon: <AppstoreAddOutlined /> },
        { key: '5-3', label: 'Asignación de Cursos', path: '/dashboard/configurar-academico/asignacion-cursos', icon: <SwapOutlined /> },
        { key: '5-4', label: 'Configurar Unidades', path: '/configurar-unidades', icon: <UnorderedListOutlined /> },
      ],
    },
    {
      key: '6',
      icon: <DollarOutlined />,
      label: 'Pagos',
      children: [
        { key: '6-1', label: 'Ingreso de Pagos', path: '/dashboard/pagos/crear', icon: <WalletOutlined /> },
        { key: '6-2', label: 'Buscar Recibo', path: '/dashboard/pagos/buscar-recibo', icon: <FileSearchOutlined /> },
        { key: '6-5', label: 'Configuración de Rubros', path: '/configurar-rubros', icon: <SettingFilled /> },
        { key: '6-6', label: 'Insolventes', path: '/dashboard/pagos/insolventes', icon: <ExclamationCircleOutlined /> },
        { key: '6-7', label: 'Exoneración Mora', path: '/exoneracion-mora', icon: <CloseCircleOutlined /> },
        { key: '6-8', label: 'Métodos de Pago', path: '/metodos-pago', icon: <CreditCardOutlined /> },
      ],
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

    // Familia (rol 3): solo ciertas opciones en Académico e Informes Académicos
    if (user.rol === 3) {
      if (item.key === '3') {
        return {
          ...item,
          children: item.children.filter((child) =>
            ['3-1', '3-2'].includes(child.key) // Aula Candelaria y Calendario Tareas
          ),
        };
      }
      if (item.key === '4') {
        return {
          ...item,
          children: item.children.filter((child) =>
            ['4-1', '4-5'].includes(child.key) // Boletas y Promedios
          ),
        };
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
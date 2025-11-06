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
  FileOutlined,
  ToolOutlined,
  BookFilled,
  ProfileOutlined,
  ClockCircleOutlined,
  PartitionOutlined,
  DesktopOutlined,
  UserAddOutlined,
  EditOutlined,
  SolutionOutlined,
  UnorderedListOutlined,
  UserDeleteOutlined,
  IdcardOutlined,
  TeamOutlined,
  DownloadOutlined,
  CalendarOutlined,
  SmileOutlined,
  CheckSquareOutlined,
  FrownOutlined,
  FilePdfOutlined,
  LineChartOutlined,
  TableOutlined,
  UsergroupAddOutlined,
  UserSwitchOutlined,
  PlusSquareOutlined,
  AppstoreAddOutlined,
  SwapOutlined,
  ScheduleOutlined,
  WalletOutlined,
  SearchOutlined,
  SettingFilled,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  FundViewOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  ClockCircleFilled,
  FileProtectOutlined,
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
        { key: '1-1', label: 'Preferencias', path: '/preferencias', icon: <ToolOutlined /> },
        { key: '1-2', label: 'Niveles Académicos', path: '/niveles-academicos', icon: <BookFilled /> },
        { key: '1-3', label: 'Grados', path: '/grados', icon: <ProfileOutlined /> },
        { key: '1-4', label: 'Jornadas', path: '/jornadas', icon: <ClockCircleOutlined /> },
        { key: '1-5', label: 'Secciones', path: '/secciones', icon: <PartitionOutlined /> },
        { key: '1-6', label: 'Uso de Plataforma', path: '/uso-plataforma', icon: <DesktopOutlined /> },
      ],
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: 'Estudiantes',
      children: [
        { key: '2-1', label: 'Inscribir Estudiante', path: '/dashboard/inscripciones/inscripciones', icon: <UserAddOutlined /> },
        { key: '2-2', label: 'Modificar Estudiante', path: '/modificar-estudiante', icon: <EditOutlined /> },
        { key: '2-3', label: 'Admisiones', path: '/admisiones', icon: <SolutionOutlined /> },
        { key: '2-4', label: 'Listados Estudiantes', path: '/listados-estudiantes', icon: <UnorderedListOutlined /> },
        { key: '2-5', label: 'Estudiantes Retirados', path: '/estudiantes-retirados', icon: <UserDeleteOutlined /> },
        { key: '2-6', label: 'Informes de Asistencia', path: '/informes-asistencia', icon: <IdcardOutlined /> },
        { key: '2-7', label: 'Credenciales de Acceso', path: '/credenciales-acceso', icon: <IdcardOutlined /> },
        { key: '2-8', label: 'Listado Padres de Familia', path: '/listado-padres', icon: <TeamOutlined /> },
        { key: '2-9', label: 'Exportar Información', path: '/exportar-informacion', icon: <DownloadOutlined /> },
      ],
    },
    {
      key: '3',
      icon: <BookOutlined />,
      label: 'Académico',
      children: [
        { key: '3-1', label: 'Aula Candelaria', path: '/aula-candelaria', icon: <BookOutlined /> },
        { key: '3-2', label: 'Calendario Tareas', path: '/calendario-tareas', icon: <CalendarOutlined /> },
        { key: '3-3', label: 'Actitudinales', path: '/actitudinales', icon: <SmileOutlined /> },
        { key: '3-4', label: 'Asistencia', path: '/asistencia', icon: <CheckSquareOutlined /> },
        { key: '3-5', label: 'Comportamiento', path: '/comportamiento', icon: <FrownOutlined /> },
      ],
    },
    {
      key: '4',
      icon: <FileTextOutlined />,
      label: 'Informes Académicos',
      children: [
        { key: '4-1', label: 'Boletas de Calificaciones', path: '/boletas-calificaciones', icon: <FilePdfOutlined /> },
        { key: '4-2', label: 'Informes Estadísticos', path: '/informes-estadisticos', icon: <LineChartOutlined /> },
        { key: '4-3', label: 'Detalle Calificaciones', path: '/detalle-calificaciones', icon: <TableOutlined /> },
        { key: '4-4', label: 'Calificaciones Maestros', path: '/calificaciones-maestros', icon: <UsergroupAddOutlined /> },
        { key: '4-5', label: 'Promedios', path: '/promedios', icon: <BarChartOutlined /> },
        { key: '4-6', label: 'Informes Contenido por Curso', path: '/informes-contenido', icon: <FileTextOutlined /> },
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
        { key: '5-3', label: 'Asignación de Cursos', path: '/asignacion-cursos', icon: <SwapOutlined /> },
        { key: '5-4', label: 'Configurar Unidades', path: '/configurar-unidades', icon: <UnorderedListOutlined /> },
        { key: '5-5', label: 'Fechas de Publicación', path: '/fechas-publicacion', icon: <ScheduleOutlined /> },
      ],
    },
    {
      key: '6',
      icon: <DollarOutlined />,
      label: 'Pagos',
      children: [
        { key: '6-1', label: 'Ingreso de Pagos', path: '/dashboard/pagos/crear', icon: <WalletOutlined /> },
        { key: '6-2', label: 'Buscar Recibo', path: '/buscar-recibo', icon: <SearchOutlined /> },
        { key: '6-3', label: 'Configuración de Rubros', path: '/configurar-rubros', icon: <SettingFilled /> },
        { key: '6-4', label: 'Mora y Recargo', path: '/mora-recargo', icon: <ExclamationCircleOutlined /> },
        { key: '6-5', label: 'Exoneración Mora', path: '/exoneracion-mora', icon: <CloseCircleOutlined /> },
        { key: '6-6', label: 'Métodos de Pago', path: '/metodos-pago', icon: <CreditCardOutlined /> },
      ],
    },
    {
      key: '7',
      icon: <BarChartOutlined />,
      label: 'Informes Financieros',
      children: [
        { key: '7-1', label: 'Informe Diario Ingresos', path: '/informe-diario-ingresos', icon: <FundViewOutlined /> },
        { key: '7-2', label: 'Historial Pagos', path: '/historial-pagos', icon: <HistoryOutlined /> },
        { key: '7-3', label: 'Solvencias por Alumno', path: '/solvencias-alumno', icon: <SafetyCertificateOutlined /> },
        { key: '7-4', label: 'Pagos Vencidos', path: '/pagos-vencidos', icon: <ClockCircleFilled /> },
      ],
    },
    {
      key: '8',
      icon: <FileOutlined />,
      label: 'Informes Generales',
      children: [
        { key: '8-1', label: 'Reportes Personalizados', path: '/reportes-personalizados', icon: <FileProtectOutlined /> },
      ],
    },
  ].filter((item) => {
    if (user.rol === 1) return true;
    if (user.rol === 2) return ['6'].includes(item.key);
    if (user.rol === 3) return ['3', '4'].includes(item.key);
    if (user.rol === 4) {
      return item.key === '3' || (item.key === '4' && item.children.some(sub => sub.path === '/boletas-calificaciones'));
    }
    return false;
  });

  // Personalizar ítems del menú con íconos solo en la etiqueta
 const customizedMenuItems = menuItems.map((item) => ({
  ...item,
  label: <Link to={item.path || '#'}>{item.label}</Link>,
  children: item.children?.map((child) => {
    //console.log('Navigating to:', child.path); // Depuración
    return {
      key: child.key,
      label: (
        <Link to={child.path}>
          {child.icon} {child.label}
        </Link>
      ),
      icon: null, // Evita duplicación de íconos
    };
  }),
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
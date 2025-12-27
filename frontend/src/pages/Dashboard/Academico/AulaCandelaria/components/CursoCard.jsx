import React from 'react';
import { Card, Space, Typography, Tag } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const CursoCard = ({ curso, esEstudiante, esDocente, esAdmin, onClick }) => {
  // Normalizar nombres de campos (la API puede devolver diferentes formatos)
  const nombreCurso = curso.NombreCurso || curso.Curso || curso.nombreCurso || 'Curso sin nombre';
  const nombreDocente = curso.NombreDocente || curso.nombreDocente || 'Sin asignar';
  const nombreGrado = curso.NombreGrado || curso.nombreGrado || '';
  const nombreSeccion = curso.NombreSeccion || curso.nombreSeccion || '';
  const nombreJornada = curso.NombreJornada || curso.nombreJornada || '';
  const totalActividades = curso.TotalActividades || curso.totalActividades || 0;

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        height: '100%',
        cursor: 'pointer'
      }}
      bodyStyle={{ padding: '20px' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {/* Header con icono */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <BookOutlined style={{ fontSize: '24px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            {nombreCurso}
          </Title>
        </div>
      </div>

      {/* Contenido según rol */}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Para ESTUDIANTES y ADMIN: Mostrar docente */}
        {(esEstudiante || esAdmin) && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ fontSize: '16px', color: '#1890ff', marginRight: '8px' }} />
            <div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                Catedrático
              </Text>
              <Text strong style={{ fontSize: '14px' }}>
                {nombreDocente}
              </Text>
            </div>
          </div>
        )}

        {/* Para DOCENTES: Mostrar grado, sección, jornada */}
        {esDocente && (
          <>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TeamOutlined style={{ fontSize: '16px', color: '#52c41a', marginRight: '8px' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                  Grado y Sección
                </Text>
                <Text strong style={{ fontSize: '14px' }}>
                  {nombreGrado} - Sección {nombreSeccion}
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: '16px', color: '#fa8c16', marginRight: '8px' }} />
              <div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                  Jornada
                </Text>
                <Text strong style={{ fontSize: '14px' }}>
                  {nombreJornada}
                </Text>
              </div>
            </div>
          </>
        )}

        {/* Actividades publicadas (para todos) */}
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Space>
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Actividades publicadas
            </Text>
          </Space>
          <Tag color={totalActividades > 0 ? 'blue' : 'default'} style={{ margin: 0 }}>
            {totalActividades}
          </Tag>
        </div>
      </Space>
    </Card>
  );
};

export default CursoCard;

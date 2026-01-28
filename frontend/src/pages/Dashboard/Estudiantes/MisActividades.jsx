import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message, Badge, Space, Empty } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, BookOutlined } from '@ant-design/icons';
import apiClient from '../../../api/apiClient';
import { getCicloActual } from '../../../utils/cicloEscolar';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const MisActividades = () => {
  const [cursos, setCursos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || { IdUsuario: null };

  useEffect(() => {
    cargarMisCursos();
  }, []);

  const cargarMisCursos = async () => {
    setLoading(true);
    try {
      // Aquí deberías tener un endpoint que devuelva los cursos del alumno
      // Por ahora usaremos un placeholder
      // const response = await apiClient.get(`/alumnos/${user.IdUsuario}/cursos`);

      // Placeholder - ajustar cuando tengas el endpoint
      message.info('Cargando cursos del estudiante...');
      setCursos([]);
    } catch (error) {
      message.error('Error al cargar tus cursos');
    } finally {
      setLoading(false);
    }
  };

  const cargarActividadesCurso = async (idCurso) => {
    setLoading(true);
    try {
      // Endpoint para obtener actividades de un curso específico del alumno
      // const response = await apiClient.get(`/actividades/curso/${idCurso}/alumno/${user.IdUsuario}`);

      message.info('Función en desarrollo - próximamente verás tus actividades aquí');
      setActividades([]);
    } catch (error) {
      message.error('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const columnasCursos = [
    {
      title: 'Curso',
      dataIndex: 'NombreCurso',
      key: 'NombreCurso',
      width: 200
    },
    {
      title: 'Docente',
      dataIndex: 'NombreDocente',
      key: 'NombreDocente',
      width: 200
    },
    {
      title: 'Unidad Actual',
      key: 'unidadActual',
      width: 150,
      render: (_, record) => (
        <Tag color="blue">Unidad {record.UnidadActual || 1}</Tag>
      )
    }
  ];

  const columnasActividades = [
    {
      title: 'Actividad',
      dataIndex: 'NombreActividad',
      key: 'NombreActividad',
      width: 200
    },
    {
      title: 'Descripción',
      dataIndex: 'Descripcion',
      key: 'Descripcion',
      width: 250,
      ellipsis: true
    },
    {
      title: 'Tipo',
      dataIndex: 'TipoActividad',
      key: 'TipoActividad',
      width: 100,
      align: 'center',
      render: (tipo) => (
        <Tag color={tipo === 'zona' ? 'blue' : 'green'}>
          {tipo === 'zona' ? 'Zona' : 'Final'}
        </Tag>
      )
    },
    {
      title: 'Punteo',
      dataIndex: 'PunteoMaximo',
      key: 'PunteoMaximo',
      width: 100,
      align: 'center',
      render: (val) => <Tag color="orange">{parseFloat(val)} pts</Tag>
    },
    {
      title: 'Fecha Entrega',
      dataIndex: 'FechaActividad',
      key: 'FechaActividad',
      width: 120,
      align: 'center',
      render: (fecha) => {
        if (!fecha) return '-';
        const fechaActividad = dayjs(fecha, 'YYYY-MM-DD');
        const hoy = dayjs();
        const esVencida = fechaActividad.isBefore(hoy, 'day');

        return (
          <Tag color={esVencida ? 'red' : 'green'}>
            {fechaActividad.format('DD/MM/YYYY')}
          </Tag>
        );
      }
    },
    {
      title: 'Mi Nota',
      key: 'miNota',
      width: 100,
      align: 'center',
      render: (_, record) => {
        // Placeholder - cuando tengas calificaciones
        if (record.Calificacion) {
          return <Tag color="success">{record.Calificacion} pts</Tag>;
        }
        return <Tag color="default">Pendiente</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <BookOutlined />
            <span>Mis Cursos - Año {getCicloActual()}</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        {cursos.length === 0 ? (
          <Empty
            description="No tienes cursos asignados para este año"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columnasCursos}
            dataSource={cursos}
            rowKey="IdCurso"
            loading={loading}
            pagination={false}
            bordered
            size="middle"
            onRow={(record) => ({
              onClick: () => {
                setCursoSeleccionado(record);
                cargarActividadesCurso(record.IdCurso);
              },
              style: { cursor: 'pointer' }
            })}
            rowClassName={(record) =>
              cursoSeleccionado?.IdCurso === record.IdCurso ? 'ant-table-row-selected' : ''
            }
          />
        )}
      </Card>

      {cursoSeleccionado && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              <span>Actividades - {cursoSeleccionado.NombreCurso}</span>
            </Space>
          }
        >
          {actividades.length === 0 ? (
            <Empty
              description="No hay actividades disponibles para este curso"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columnasActividades}
              dataSource={actividades}
              rowKey="IdActividad"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total: ${total} actividades`
              }}
              bordered
              size="middle"
              scroll={{ x: 1000 }}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default MisActividades;

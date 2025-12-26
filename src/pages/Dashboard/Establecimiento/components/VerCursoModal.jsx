import React from 'react';
import { Modal, Descriptions, Tag } from 'antd';
import { BookOutlined, NumberOutlined, CodeOutlined, IdcardOutlined } from '@ant-design/icons';

const VerCursoModal = ({ visible, curso, grados, onCancel }) => {
  if (!curso) return null;

  const getNombreGrado = (idGrado, cursoGrado = null) => {
    // Si el curso ya tiene el objeto Grado incluido, usarlo
    if (cursoGrado && cursoGrado.NombreGrado) {
      return cursoGrado.NombreGrado;
    }
    // Si no, buscar en el array de grados
    const grado = grados.find(g => g.IdGrado === idGrado);
    return grado ? grado.NombreGrado : 'No especificado';
  };

  return (
    <Modal
      title={
        <span>
          <BookOutlined /> Detalles del Curso
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Descriptions bordered column={1} size="middle">
        <Descriptions.Item label={<span><IdcardOutlined /> ID Curso</span>}>
          {curso.idCurso}
        </Descriptions.Item>

        <Descriptions.Item label={<span><BookOutlined /> Grado</span>}>
          <strong>{getNombreGrado(curso.idGrado, curso.Grado)}</strong>
        </Descriptions.Item>

        <Descriptions.Item label={<span><NumberOutlined /> Número de Orden</span>}>
          {curso.NoOrden}
        </Descriptions.Item>

        <Descriptions.Item label={<span><BookOutlined /> Nombre del Curso</span>}>
          <strong>{curso.Curso || 'No especificado'}</strong>
        </Descriptions.Item>

        <Descriptions.Item label={<span><CodeOutlined /> Código SIRE</span>}>
          {curso.CodigoSire || <Tag color="blue">Curso Propio del Colegio</Tag>}
        </Descriptions.Item>

        <Descriptions.Item label="Estado">
          <Tag color={curso.Estado ? 'green' : 'red'} style={{ fontSize: '14px' }}>
            {curso.Estado ? 'ACTIVO' : 'INACTIVO'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default VerCursoModal;

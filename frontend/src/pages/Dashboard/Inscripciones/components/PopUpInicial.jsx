// src/pages/dashboard/Inscripciones/components/PopUpInicial.jsx
import React from 'react';
import { Modal, Radio, Space } from 'antd';

const PopUpInicial = ({ open, onOk }) => {
  const [value, setValue] = React.useState(null);

  return (
    <Modal
      title="Tipo de Inscripción"
      open={open}
      onOk={() => onOk(value)}
      onCancel={() => {}}
      okText="Continuar"
      cancelText="Cancelar"
      okButtonProps={{ disabled: !value }}
    >
      <Radio.Group onChange={(e) => setValue(e.target.value)} value={value}>
        <Space direction="vertical">
          <Radio value="nuevo">Inscribir un nuevo alumno</Radio>
          <Radio value="reinscribir">Re-inscribir a un alumno existente</Radio>
        </Space>
      </Radio.Group>
    </Modal>
  );
};

export default PopUpInicial;
// src/pages/dashboard/Inscripciones/components/PopUpInicial.jsx
import React, { useEffect, useRef } from 'react';
import { Modal, Radio, Space } from 'antd';


const PopUpInicial = ({ open, onOk, onCancel, dispatch }) => {
  const [value, setValue] = React.useState(null);
  const hasLoaded = useRef(false); // ← Bandera para evitar doble carga

  // REINICIAR LA BANDERA CUANDO EL POPUP SE CIERRA
  useEffect(() => {
    if (!open) {
      hasLoaded.current = false; // ← Permite recargar la próxima vez que se abra
      console.log('POPUP CERRADO → BANDERA REINICIADA');
    }
  }, [open]);



  return (
    <Modal
      title="Tipo de Inscripción"
      open={open}
      onOk={() => onOk(value)}
      onCancel={onCancel}
      okText="Continuar"
      cancelText="Cancelar"
      okButtonProps={{ disabled: !value }}
      closable={true}
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
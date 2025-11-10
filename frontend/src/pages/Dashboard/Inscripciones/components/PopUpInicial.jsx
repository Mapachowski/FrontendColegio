// src/pages/dashboard/Inscripciones/components/PopUpInicial.jsx
import React, { useEffect, useRef } from 'react';
import { Modal, Radio, Space, message } from 'antd';
import apiClient from '../../../../api/apiClient';

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

  // CARGAR CATÁLOGOS SOLO UNA VEZ CUANDO SE ABRE
  useEffect(() => {
    if (!open || !dispatch || hasLoaded.current) return;

    console.log('CARGANDO CATÁLOGOS (PRIMERA VEZ)...');
    hasLoaded.current = true;

    const cargarCatalogos = async () => {
      try {
        const [gradosRes, seccionesRes, jornadasRes] = await Promise.all([
          apiClient.get('/grados'),
          apiClient.get('/secciones'),
          apiClient.get('/jornadas'),
        ]);

        const payload = {
          grados: gradosRes.data.data || gradosRes.data,
          secciones: seccionesRes.data.data || seccionesRes.data,
          jornadas: jornadasRes.data.data || jornadasRes.data,
        };

        console.log('CATÁLOGOS CARGADOS:', payload);
        dispatch({ type: 'SET_CATALOGOS', payload });
      } catch (error) {
        console.error('ERROR AL CARGAR CATÁLOGOS:', error);
        message.error('Error al cargar catálogos');
      }
    };

    cargarCatalogos();
  }, [open, dispatch]);

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
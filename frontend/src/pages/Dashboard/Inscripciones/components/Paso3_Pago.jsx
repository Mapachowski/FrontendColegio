// src/pages/dashboard/Inscripciones/components/Paso3_Pago.jsx
import React from 'react';
import { Form, Checkbox, Input, Button, message } from 'antd';

const Paso3_Pago = ({ state, dispatch, onFinalizar }) => {
  const { inscripcion, pago } = state;

  const costoInscripcion = 200;
  const costoEnero = Number(inscripcion.Mensualidad || 0);
  const total = ((pago.pagarInscripcion ? costoInscripcion : 0) + (pago.pagarEnero ? costoEnero : 0)).toFixed(2);

  const handleClick = () => {
    if (total === '0.00') {
      message.error('Seleccione al menos un pago');
      return;
    }
    onFinalizar(); // ← Llama al de Inscripciones.jsx
  };

  return (
    <Form layout="vertical">
      {/* CHECKBOXES */}
      <Form.Item>
        <Checkbox
          checked={pago.pagarInscripcion}
          onChange={(e) => dispatch({ type: 'UPDATE_PAGO', payload: { pagarInscripcion: e.target.checked } })}
        >
          Pagar inscripción <strong>Q {costoInscripcion.toFixed(2)}</strong>
        </Checkbox>
      </Form.Item>

      <Form.Item>
        <Checkbox
          checked={pago.pagarEnero}
          onChange={(e) => dispatch({ type: 'UPDATE_PAGO', payload: { pagarEnero: e.target.checked } })}
        >
          Pagar enero <strong>Q {costoEnero.toFixed(2)}</strong>
        </Checkbox>
      </Form.Item>

      {/* RECIBO */}
      <Form.Item label="Número de Recibo">
        <Input
          placeholder="Opcional"
          value={pago.NumeroRecibo}
          onChange={(e) => dispatch({ type: 'UPDATE_PAGO', payload: { NumeroRecibo: e.target.value } })}
        />
      </Form.Item>

      <Form.Item label="Nombre en el Recibo">
        <Input
          placeholder="Ej: Juan Pérez"
          value={pago.NombreRecibo}
          onChange={(e) => dispatch({ type: 'UPDATE_PAGO', payload: { NombreRecibo: e.target.value } })}
        />
      </Form.Item>

      <Form.Item label="Dirección en el Recibo">
        <Input
          placeholder="Ej: 10ma avenida 5-20, Zona 1"
          value={pago.DireccionRecibo}
          onChange={(e) => dispatch({ type: 'UPDATE_PAGO', payload: { DireccionRecibo: e.target.value } })}
        />
      </Form.Item>

      {/* TOTAL */}
      <div style={{
        padding: '16px',
        background: '#f0f8ff',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003366',
        margin: '16px 0'
      }}>
        TOTAL A PAGAR: <span style={{ color: '#d4380d' }}>Q {total}</span>
      </div>

      {/* BOTONES */}
      <Form.Item>
        <Button onClick={() => dispatch({ type: 'PREV_STEP' })} style={{ marginRight: 8 }}>
          Anterior
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={handleClick}
          style={{ float: 'right', background: '#003366', borderColor: '#003366' }}
        >
          CONFIRMAR Y GENERAR RECIBO
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Paso3_Pago;
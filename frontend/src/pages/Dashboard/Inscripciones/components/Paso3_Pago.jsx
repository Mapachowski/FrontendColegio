// src/pages/dashboard/Inscripciones/components/Paso3_Pago.jsx
import React from 'react';
import { Form, Checkbox, Input, Button, message } from 'antd';
import moment from 'moment';

const Paso3_Pago = ({ state, dispatch, onFinalizar }) => {
  const { inscripcion, pago } = state;

  const esPrimeroBasico = inscripcion.IdGrado === 7; // IdGrado para Primero Básico
  const costoInscripcion = Number(inscripcion.ValorInscripcion || 200);
  const costoEnero = Number(inscripcion.Mensualidad || 0);
  const costoMecanografiaInsc = 40;
  const costoMecanografiaEnero = 40;

  const total = (
    (pago.pagarInscripcion ? costoInscripcion : 0) +
    (pago.pagarEnero ? costoEnero : 0) +
    (esPrimeroBasico && pago.pagarMecanografiaInsc ? costoMecanografiaInsc : 0) +
    (esPrimeroBasico && pago.pagarMecanografiaEnero ? costoMecanografiaEnero : 0)
  ).toFixed(2);
    const generarPagos = () => {
      const { inscripcion, pago } = state;
      const esPrimeroBasico = inscripcion.IdGrado === 7;
      const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
      const idFamilia = state.alumno.IdFamilia || 1;
      const carnet = state.alumno.Carnet || '20240127';

      const pagos = [];

      // 1. Inscripción
      if (pago.pagarInscripcion) {
        pagos.push({
          FechaPago: fecha,
          IdFamilia: idFamilia,
          Carnet: carnet,
          IdTipoPago: 1,
          Concepto: 'Inscripción',
          IdEstadoPago: 1,
          Monto: Number(inscripcion.ValorInscripcion).toFixed(2),
          IdUsuario: 4,
          FechaCreacion: fecha,
          // ... otros campos
        });
      }

      // 2. Enero (Colegiatura)
      if (pago.pagarEnero) {
        pagos.push({
          FechaPago: fecha,
          IdFamilia: idFamilia,
          Carnet: carnet,
          IdTipoPago: 2,
          Concepto: 'Enero',
          IdEstadoPago: 1,
          Monto: Number(inscripcion.Mensualidad).toFixed(2),
          IdUsuario: 4,
          FechaCreacion: fecha,
        });
      }

      // 3. Inscripción Mecanografía (solo Primero Básico)
      if (esPrimeroBasico && pago.pagarMecanografiaInsc) {
        pagos.push({
          FechaPago: fecha,
          IdFamilia: idFamilia,
          Carnet: carnet,
          IdTipoPago: 4,
          Concepto: 'Inscripción Mecanografía',
          IdEstadoPago: 1,
          Monto: '40.00',
          IdUsuario: 4,
          FechaCreacion: fecha,
        });
      }

      // 4. Enero Mecanografía (solo Primero Básico)
      if (esPrimeroBasico && pago.pagarMecanografiaEnero) {
        pagos.push({
          FechaPago: fecha,
          IdFamilia: idFamilia,
          Carnet: carnet,
          IdTipoPago: 3,
          Concepto: 'Enero',
          IdEstadoPago: 1,
          Monto: '40.00',
          IdUsuario: 4,
          FechaCreacion: fecha,
        });
      }

      return pagos;
    };
      const handleClick = () => {
        if (total === '0.00') {
          message.error('Seleccione al menos un pago');
          return;
        }

        const pagos = generarPagos();
        onFinalizar(pagos); // ← Pásale los pagos al padre
      };
  return (
    <Form layout="vertical">
      {/* CHECKBOXES BÁSICOS */}
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

      {/* CHECKBOXES EXTRAS PARA PRIMERO BÁSICO */}
      {esPrimeroBasico && (
        <>
          <Form.Item>
            <Checkbox
              checked={pago.pagarMecanografiaInsc}
              onChange={(e) => dispatch({ type: 'UPDATE_PAGO', payload: { pagarMecanografiaInsc: e.target.checked } })}
            >
              Pagar inscripción Mecanografía <strong>Q {costoMecanografiaInsc.toFixed(2)}</strong>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Checkbox
              checked={pago.pagarMecanografiaEnero}
              onChange={(e) => dispatch({ type: 'UPDATE_PAGO', payload: { pagarMecanografiaEnero: e.target.checked } })}
            >
              Pagar enero Mecanografía <strong>Q {costoMecanografiaEnero.toFixed(2)}</strong>
            </Checkbox>
          </Form.Item>
        </>
      )}

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
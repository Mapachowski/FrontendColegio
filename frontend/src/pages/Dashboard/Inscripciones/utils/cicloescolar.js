// frontend/src/utils/cicloEscolar.js

/**
 * Devuelve el ciclo escolar actual.
 * Si es noviembre o diciembre → año siguiente
 */
export const getCicloEscolar = () => {
  const hoy = new Date();
  const mes = hoy.getMonth(); // 0 = enero, 10 = noviembre
  const año = hoy.getFullYear();

  return mes >= 10 ? (año + 1).toString() : año.toString();
};

/**
 * Devuelve el ciclo anterior (para reinscripciones)
 */
export const getCicloAnterior = () => {
  return (parseInt(getCicloEscolar()) - 1).toString();
};
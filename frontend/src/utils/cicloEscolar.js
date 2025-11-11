// src/utils/cicloEscolar.js
export const getCicloActual = () => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0 = enero

  // Noviembre (10) o diciembre (11) → ciclo del próximo año
  return mes >= 10 ? año + 1 : año;
};

export const getCicloAnterior = () => getCicloActual() - 1;
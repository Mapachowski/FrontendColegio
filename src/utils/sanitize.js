// utils/sanitize.js
import DOMPurify from 'dompurify';

/**
 * Sanitiza texto HTML para prevenir ataques XSS
 * @param {string} dirty - Texto potencialmente peligroso
 * @returns {string} - Texto sanitizado y seguro
 */
export const sanitizeHTML = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No permitir ningún tag HTML
    ALLOWED_ATTR: [], // No permitir ningún atributo
    KEEP_CONTENT: true, // Mantener el contenido de texto
  });
};

/**
 * Sanitiza texto permitiendo solo tags seguros básicos (para rich text)
 * @param {string} dirty - Texto potencialmente peligroso
 * @returns {string} - Texto sanitizado con HTML básico permitido
 */
export const sanitizeRichText = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Escapa caracteres especiales para uso en HTML
 * Alternativa lightweight sin DOMPurify
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
export const escapeHTML = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitiza un objeto completo, aplicando sanitización a todos los valores string
 * @param {Object} obj - Objeto con datos potencialmente peligrosos
 * @returns {Object} - Objeto con todos los strings sanitizados
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      if (typeof value === 'string') {
        sanitized[key] = sanitizeHTML(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value); // Recursivo para objetos anidados
      } else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
};

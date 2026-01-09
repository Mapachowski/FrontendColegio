# Especificaciones del Proyecto - Sistema Escolar Frontend

**Última actualización:** 2025-12-22
**Frontend:** React + Ant Design + React Router
**Backend API:** Node.js/Express (puerto 4000)

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Patrones de la API](#patrones-de-la-api)
3. [Estructura de Datos](#estructura-de-datos)
4. [Utilidades Centralizadas](#utilidades-centralizadas)
5. [Módulos Implementados](#módulos-implementados)
6. [Convenciones de Código](#convenciones-de-código)
7. [Problemas Conocidos y Soluciones](#problemas-conocidos-y-soluciones)

---

## 🏗️ Arquitectura General

### Stack Tecnológico
- **React 18+** con Hooks
- **Ant Design 5.x** para componentes UI
- **React Router v6** para navegación
- **Axios** para llamadas HTTP (vía `apiClient`)
- **Moment.js** para manejo de fechas

### Estructura de Carpetas
```
frontend/
├── src/
│   ├── api/
│   │   └── apiClient.js          # Cliente HTTP configurado
│   ├── components/
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── Login/
│   │   └── Dashboard/
│   │       ├── Inscripciones/
│   │       ├── Alumnos/
│   │       ├── Pagos/
│   │       ├── ConfigurarAcademico/
│   │       │   └── AsignacionCursos/
│   │       └── Estudiantes/
│   ├── utils/
│   │   ├── cicloescolar.js       # Utilidades de año escolar
│   │   ├── sanitize.js           # Prevención XSS
│   │   └── bitacora.js           # Logs de auditoría
│   └── App.jsx
```

---

## 🔌 Patrones de la API

### URL Base
```javascript
http://localhost:4000/api
```

### Inconsistencias de Respuestas (CRÍTICO)

La API devuelve diferentes estructuras según el endpoint. El frontend debe manejar ambas:

#### Tipo 1: Respuesta con wrapper `{success, data}`
```javascript
// Usado por: /docentes, /grados, /familias, /alumnos
{
  "success": true,
  "data": [...] o {...}
}
```

#### Tipo 2: Array directo
```javascript
// Usado por: /secciones, /jornadas
[...items]
```

#### Tipo 3: Objeto con claves numéricas (cuando hay filtros)
```javascript
// A veces devuelto por endpoints filtrados
{
  "success": true,
  "data": [
    {
      "0": { ...item1 },
      "1": { ...item2 },
      "2": { ...item3 }
    },
    { fieldCount: 0, ... } // metadata de MySQL
  ]
}
```

### Patrón de Manejo Recomendado
```javascript
// Para manejar todas las variantes:
let data = [];

if (response.data.success && response.data.data) {
  const apiData = response.data.data;

  if (Array.isArray(apiData)) {
    // Verificar si es objeto con claves numéricas
    if (apiData.length > 0 && typeof apiData[0] === 'object' && !apiData[0].IdCampo) {
      data = Object.keys(apiData[0])
        .filter(key => !isNaN(key))
        .map(key => apiData[0][key])
        .filter(item => item && item.IdCampo);
    } else {
      data = apiData;
    }
  } else if (typeof apiData === 'object' && apiData.IdCampo) {
    data = [apiData]; // Objeto único → array
  }
} else if (Array.isArray(response.data)) {
  data = response.data; // Array directo
}
```

### Casing de Campos

⚠️ **IMPORTANTE:** La API usa **PascalCase** en la mayoría de campos, pero algunos endpoints usan **camelCase**.

**PascalCase (mayoría):**
- `IdAlumno`, `NombreCompleto`, `FechaNacimiento`
- `IdDocente`, `NombreDocente`
- `IdGrado`, `NombreGrado`

**camelCase (algunos endpoints):**
- Endpoints de cursos: `idCurso`, `idGrado`
- Parámetros de query: `anio` (NO `Anio`)

### Endpoints Principales

#### Alumnos
```javascript
GET    /alumnos                    // Lista todos
GET    /alumnos/:id                // Obtener uno
POST   /alumnos                    // Crear (devuelve IdAlumno)
PUT    /alumnos/:id                // Actualizar (requiere IdColaborador)
DELETE /alumnos/:id

// PUT Payload obligatorio:
{
  "IdColaborador": 1,  // ⚠️ OBLIGATORIO
  "IdUsuario": 10      // Opcional - solo enviar campos a actualizar
}
```

#### Familias
```javascript
GET    /familias
POST   /familias                   // Crear (incluir IdUsuario si existe)
PUT    /familias/:id

// POST Payload:
{
  "NombreFamilia": "Familia López",
  "Direccion": "...",
  "TelefonoContacto": "...",
  "EmailContacto": "...",
  "IdColaborador": 1,
  "NombreRecibo": "...",
  "DireccionRecibo": "...",
  "IdUsuario": 10      // ⚠️ Incluir si se creó usuario antes
}
```

#### Usuarios (Credenciales de Acceso)
```javascript
POST   /usuarios

// Payload:
{
  "NombreUsuario": "juan123",      // Unique
  "NombreCompleto": "Juan Pérez",
  "Contrasena": "password123",
  "IdRol": 5,                       // 3=Familia, 5=Estudiante
  "IdColaborador": 1
}

// Response:
{
  "success": true,
  "IdUsuario": 123,                 // ⚠️ Capturar para vincular
  "message": "Usuario creado"
}
```

#### Asignaciones de Docentes
```javascript
GET    /asignaciones?anio=2026&idGrado=1...
POST   /asignaciones
PUT    /asignaciones/:id
DELETE /asignaciones/:id

GET    /cursos/por-grado?idGrado=1&idSeccion=1&idJornada=1&anio=2026
```

---

## 📊 Estructura de Datos

### Roles de Usuario
```javascript
const ROLES = {
  ADMIN: 1,
  COLABORADOR: 2,
  FAMILIA: 3,
  DOCENTE: 4,
  ESTUDIANTE: 5
};
```

### Usuario en LocalStorage
```javascript
{
  "IdUsuario": 1,
  "IdColaborador": 1,  // Puede ser null para familias/estudiantes
  "NombreUsuario": "admin",
  "NombreCompleto": "Administrador Sistema",
  "IdRol": 1,
  "Permisos": []
}
```

### Estructura de Alumno
```javascript
{
  "IdAlumno": 1234,
  "Matricula": "2025-001",
  "Nombres": "Juan Carlos",
  "Apellidos": "Pérez García",
  "FechaNacimiento": "2010-05-15",
  "Genero": "Masculino",
  "IdFamilia": 5,
  "IdUsuario": 10,               // ⚠️ Vinculado después de crear usuario
  "Estado": true,
  "NumeroEmergencia": "1234-5678",
  "ComunidadLinguistica": "Q'eq"
}
```

### Estructura de Familia
```javascript
{
  "IdFamilia": 1,
  "NombreFamilia": "Familia López",
  "Direccion": "Zona 1, Ciudad",
  "TelefonoContacto": "1234-5678",
  "EmailContacto": "familia@example.com",
  "IdUsuario": 20,               // ⚠️ Vinculado al crear
  "NombreRecibo": "1234567890101", // DPI del representante
  "DireccionRecibo": "San Juan Ostuncalco"
}
```

### Estructura de Asignación Docente
```javascript
{
  "IdAsignacionDocente": 1,
  "IdDocente": 1,
  "NombreDocente": "Ana López",
  "IdCurso": 3,
  "NombreCurso": "Matemáticas",
  "IdGrado": 16,
  "NombreGrado": "Preprimaria",
  "IdSeccion": 1,
  "NombreSeccion": "A",
  "IdJornada": 1,
  "NombreJornada": "Matutina",
  "Anio": 2026,
  "Estado": 1,
  "TotalUnidades": 4,
  "TotalActividades": 6
}
```

---

## 🛠️ Utilidades Centralizadas

### `cicloescolar.js`

**Ubicación:** `src/utils/cicloescolar.js`

```javascript
// Retorna el año escolar actual
// Si mes >= 10 (nov-dic) → año + 1
// Sino → año actual
export const getCicloActual = () => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth(); // 0-indexed
  return mes >= 10 ? año + 1 : año;
};

export const getCicloAnterior = () => getCicloActual() - 1;
```

**Uso:**
```javascript
import { getCicloActual } from '../utils/cicloescolar';

const [filtros, setFiltros] = useState({
  anio: getCicloActual() // Siempre usar esto para año por defecto
});
```

### `sanitize.js`

**Ubicación:** `src/utils/sanitize.js`

Prevención de XSS al mostrar datos del usuario:

```javascript
export const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
```

---

## 📦 Módulos Implementados

### 1. Inscripciones de Alumnos

**Ubicación:** `src/pages/Dashboard/Inscripciones/`

**Flujo de Creación de Estudiante Nuevo:**

1. **Crear Familia** (si no existe):
   - Crear usuario de familia primero → obtener `IdUsuario`
   - Crear familia con `IdUsuario` incluido
   - Usuario: `"familia_" + apellidos` (lowercase, sin espacios)
   - Contraseña: igual al usuario
   - IdRol: `3`

2. **Crear Alumno**:
   - POST `/alumnos` → obtener `IdAlumno`

3. **Crear Usuario del Estudiante**:
   - Usuario: `IdAlumno` (string)
   - Contraseña: `IdAlumno` (string)
   - IdRol: `5`
   - Capturar `IdUsuario` de la respuesta

4. **Actualizar Alumno con IdUsuario**:
   ```javascript
   PUT /alumnos/${IdAlumno}
   {
     "IdColaborador": 1,    // ⚠️ OBLIGATORIO
     "IdUsuario": 123
   }
   ```

5. **Crear Inscripción**

6. **Crear Pagos** (si aplica)

**Archivos clave:**
- `Inscripciones.jsx` - Componente principal
- `components/FamiliaModal.jsx` - Modal de gestión de familias
- `components/Paso1_Alumno.jsx` - Datos del alumno
- `components/Paso2_Inscripcion.jsx` - Datos académicos
- `components/Paso3_Pago.jsx` - Pagos y recibos

### 2. Asignación de Docentes a Cursos

**Ubicación:** `src/pages/Dashboard/ConfigurarAcademico/AsignacionCursos/`

**Componentes:**

#### `AsignacionCursos.jsx` - Vista principal
- Tabla con filtros (año, grado, sección, jornada, docente)
- CRUD de asignaciones individuales
- Botón para Asignación Masiva

**Características:**
- Año por defecto: `getCicloActual()`
- Manejo de respuestas con claves numéricas
- Columnas con campos planos (no nested)

#### `AsignacionMasiva.jsx` - Asignación por mayor
- Filtros: año, grado, sección, jornada
- Tabla editable con todos los cursos del grado
- Cursos ya asignados: fila verde + select deshabilitado
- Cursos sin asignar: select habilitado
- Creación masiva de asignaciones

**Endpoint especial:**
```javascript
GET /cursos/por-grado?idGrado=16&idSeccion=1&idJornada=1&anio=2026
```

**Modales:**
- `CrearAsignacionModal.jsx` - Nueva asignación individual
- `EditarAsignacionModal.jsx` - Cambiar docente
- `VerAsignacionModal.jsx` - Ver detalles + unidades

---

## 📝 Convenciones de Código

### 1. Nombres de Usuario

**Estudiantes:**
```javascript
const nombreUsuario = String(IdAlumno); // Ej: "1234"
const contraseña = String(IdAlumno);    // Ej: "1234"
```

**Familias:**
```javascript
const apellidos = "López Hernández";
const nombreUsuario = `familia_${apellidos.trim().toLowerCase().replace(/\s+/g, '_')}`;
// Resultado: "familia_lópez_hernández"
const contraseña = nombreUsuario;
```

### 2. Manejo de Fechas

```javascript
import moment from 'moment';

// Para enviar a API:
const fecha = moment(dateValue).format('YYYY-MM-DD');

// Para mostrar:
const fechaFormateada = moment(fecha).format('DD/MM/YYYY');
```

### 3. Obtención del Usuario Logueado

```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const IdColaborador = user.IdUsuario || user.IdColaborador;
```

### 4. Logs de Debug

**Durante desarrollo:**
```javascript
console.log('=== DESCRIPCIÓN ===');
console.log('Variable:', valor);
console.log('==================');
```

**Antes de producción:** Remover todos los `console.log`

### 5. Manejo de Errores

```javascript
try {
  const response = await apiClient.post('/endpoint', data);
  if (response.data.success) {
    message.success('Operación exitosa');
  }
} catch (error) {
  console.error('Error:', error);
  console.error('Response:', error.response?.data);
  const errorMsg = error.response?.data?.message || 'Error desconocido';
  message.error(errorMsg);
}
```

### 6. Estructura de Modales

```javascript
const MiModal = ({ visible, onCancel, onSuccess, data }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && data) {
      form.setFieldsValue(data);
    } else {
      form.resetFields();
    }
  }, [visible, data]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Lógica...
      message.success('Éxito');
      onSuccess();
    } catch (error) {
      message.error('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Título"
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} onFinish={handleSubmit}>
        {/* Campos */}
      </Form>
    </Modal>
  );
};
```

---

## ⚠️ Problemas Conocidos y Soluciones

### 1. Respuestas con Claves Numéricas

**Problema:** Algunos endpoints filtrados devuelven objetos con claves numéricas en lugar de arrays.

**Solución:**
```javascript
if (data.length > 0 && typeof data[0] === 'object' && !data[0].IdCampo) {
  const converted = Object.keys(data[0])
    .filter(key => !isNaN(key))
    .map(key => data[0][key])
    .filter(item => item && item.IdCampo);
  return converted;
}
```

### 2. Campos Nested vs Planos

**Problema:** Inconsistencia entre lo que devuelve la API (plano) y lo que espera el código (nested).

**Incorrecto:**
```javascript
{
  title: 'Docente',
  dataIndex: ['docente', 'NombreDocente'] // ❌
}
```

**Correcto:**
```javascript
{
  title: 'Docente',
  dataIndex: 'NombreDocente' // ✅
}
```

### 3. Parámetros en Query Strings

**Problema:** Casing incorrecto en parámetros.

**Incorrecto:**
```javascript
GET /api/cursos?IdGrado=1&Anio=2026  // ❌
```

**Correcto:**
```javascript
GET /api/cursos?idGrado=1&anio=2026  // ✅
```

### 4. Single Object vs Array

**Problema:** Cuando hay filtros, a veces la API devuelve un objeto en lugar de array.

**Solución:**
```javascript
if (typeof data === 'object' && data.IdCampo) {
  data = [data]; // Convertir a array
}
```

---

## 🔐 Seguridad

### Prevención de XSS

**Siempre sanitizar** datos del usuario antes de mostrarlos:

```javascript
import { escapeHTML } from '../utils/sanitize';

const nombreSafe = escapeHTML(nombreUsuario);
```

### Validación de Formularios

```javascript
<Form.Item
  name="campo"
  rules={[
    { required: true, message: 'Campo obligatorio' },
    { min: 3, message: 'Mínimo 3 caracteres' }
  ]}
>
  <Input />
</Form.Item>
```

---

## 🚀 Flujos Completos

### Flujo: Inscribir Estudiante Nuevo

```
1. PopUpInicial → Seleccionar "Nuevo"
2. Paso 1: Datos del Alumno
   ├─ Abrir FamiliaModal
   │  ├─ Crear Usuario Familia (POST /usuarios)
   │  │  └─ Capturar IdUsuario
   │  └─ Crear Familia (POST /familias con IdUsuario)
   └─ Guardar IdFamilia en state
3. Paso 2: Datos de Inscripción
   └─ Seleccionar grado, sección, jornada
4. Paso 3: Datos de Pago
   └─ Finalizar
      ├─ Crear Alumno (POST /alumnos)
      │  └─ Capturar IdAlumno
      ├─ Crear Usuario Estudiante (POST /usuarios)
      │  └─ Capturar IdUsuario
      ├─ Actualizar Alumno (PUT /alumnos/:id con IdUsuario)
      ├─ Crear Inscripción (POST /inscripciones)
      ├─ Crear Pagos (POST /pagos)
      └─ Generar Recibos PDF
```

### Flujo: Asignación Masiva de Docentes

```
1. Seleccionar filtros (año, grado, sección, jornada)
2. Cargar cursos (GET /cursos/por-grado)
3. Convertir respuesta con claves numéricas a array
4. Renderizar tabla:
   ├─ Cursos ya asignados: Verde + disabled
   └─ Cursos sin asignar: Select de docentes
5. Usuario selecciona docentes
6. Click "Crear Asignaciones"
7. Loop: POST /asignaciones para cada curso seleccionado
8. Mostrar resumen (exitosas/fallidas)
9. Recargar tabla
```

---

## 📚 Referencias Rápidas

### Imports Comunes

```javascript
// React
import React, { useState, useEffect } from 'react';

// Ant Design
import { Table, Button, Form, Input, Select, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

// Router
import { useNavigate } from 'react-router-dom';

// API
import apiClient from '../../../api/apiClient';

// Utilidades
import { getCicloActual } from '../../../utils/cicloescolar';
import { escapeHTML } from '../../../utils/sanitize';

// Fechas
import moment from 'moment';
```

### Comandos de Desarrollo

```bash
# Iniciar frontend
cd frontend
npm start

# Backend (puerto 4000)
cd backend
npm run dev
```

---

## 📞 Notas para Nuevos Desarrolladores

1. **Siempre revisar** los logs de la API antes de depurar el frontend
2. **Usar `getCicloActual()`** para años escolares, no calcular manualmente
3. **Verificar casing** de parámetros antes de hacer requests
4. **Manejar arrays y objetos únicos** en todas las respuestas de API
5. **Incluir `IdColaborador`** en todos los PUT/POST que lo requieran
6. **Crear usuarios antes** de vincularlos a entidades (estudiantes/familias)
7. **No asumir estructura nested** - la mayoría de respuestas son planas
8. **Logs extensivos durante desarrollo**, limpiar antes de producción

---

**Documento creado:** 2025-12-22
**Mantenido por:** Equipo de Desarrollo
**Última revisión:** Implementación de Asignaciones Masivas + Creación de Usuarios

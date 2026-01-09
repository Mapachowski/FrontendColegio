# Implementación de Editar Alumno - Documentación

## Resumen
Se implementó completamente la funcionalidad de edición de alumnos con datos reales de la API. El sistema permite buscar alumnos por ciclo escolar, cargar su información completa y modificar sus datos personales, inscripción y familia.

## Estructura de Archivos

### 1. BuscarAlumnoEditarModal.jsx
**Ubicación:** `frontend/src/pages/Dashboard/Alumnos/components/BuscarAlumnoEditarModal.jsx`

**Funcionalidad:**
- Carga lista de todos los alumnos desde `/alumnos`
- Permite buscar por nombre/apellido usando un Select con búsqueda
- Filtra por ciclo escolar automático (calcula el año actual)
- Busca inscripción del alumno usando `/inscripciones/buscar-alumno`
- Al seleccionar un alumno, pasa todos sus datos al componente padre

**Endpoints usados:**
- `GET /alumnos` - Obtiene lista de alumnos
- `GET /inscripciones/buscar-alumno?IdAlumno={id}&CicloEscolar={ciclo}` - Busca inscripción específica

### 2. EditarAlumno.jsx
**Ubicación:** `frontend/src/pages/Dashboard/Alumnos/EditarAlumno.jsx`

**Funcionalidad:**
- Muestra modal de búsqueda al inicio
- Al seleccionar alumno, carga:
  - Datos del alumno (nombre, matrícula, etc.)
  - Datos de inscripción (grado, sección, jornada)
  - Datos de familia completos
- Permite editar:
  - Nombre y teléfono de contacto de emergencia
  - Visibilidad del alumno en el sistema
  - Sección y jornada de inscripción
  - Estado de inscripción (Activa/Inactiva)
  - Observaciones cuando está inactiva
- Guarda cambios con validación

**Endpoints usados:**
- `GET /familias/{IdFamilia}` - Obtiene datos de familia
- `GET /secciones` - Carga catálogo de secciones
- `GET /jornadas` - Carga catálogo de jornadas
- `PUT /alumnos/{IdAlumno}` - Actualiza datos del alumno
- `PUT /inscripciones/{IdInscripcion}` - Actualiza datos de inscripción

**Estados manejados:**
- `alumnoData` - Información completa del alumno
- `familiaData` - Información de la familia
- `inscripcionData` - Información de la inscripción
- `numeroEmergencia` - Teléfono de contacto de emergencia
- `nombreEmergencia` - Nombre del contacto de emergencia
- `visible` - Si el alumno es visible en el sistema
- `idSeccion` - ID de la sección seleccionada
- `idJornada` - ID de la jornada seleccionada
- `inscripcionActiva` - Estado de la inscripción
- `observacion` - Motivo de inactividad

### 3. EditarFamiliaModal.jsx
**Ubicación:** `frontend/src/pages/Dashboard/Alumnos/components/EditarFamiliaModal.jsx`

**Funcionalidad:**
- Carga datos de facturación de la familia
- Carga responsables (padre, madre, otro) desde la API
- Permite editar:
  - Nombre para recibo
  - Teléfono de contacto
  - Email
  - Dirección completa
  - Datos de responsables (nombre, DPI, NIT)
- Muestra qué responsable es el principal con un Tag
- Guarda cambios y actualiza el componente padre

**Endpoints usados:**
- `GET /responsables/familia/{IdFamilia}` - Obtiene responsables de la familia
- `PUT /familias/{IdFamilia}` - Actualiza datos de familia
- `PUT /responsables/{IdResponsable}` - Actualiza datos de responsable existente
- `POST /responsables` - Crea nuevo responsable si no existía

**Tipos de Responsable:**
- `IdResponsableTipo = 1` → Padre
- `IdResponsableTipo = 2` → Madre
- `IdResponsableTipo = 11` → Otro

## Flujo de Usuario

1. Usuario hace clic en "Modificar Estudiante" en el sidebar
2. Se abre modal de búsqueda de alumno
3. Usuario selecciona alumno y ciclo escolar
4. Usuario presiona "Buscar"
5. Se muestra tabla con resultados
6. Usuario hace clic en el alumno deseado
7. Se carga formulario de edición con dos pestañas:
   - **Pestaña 1:** Datos Personales y Familia
     - Contacto de emergencia
     - Vista de datos de familia
     - Botón "Modificar Familia" abre modal
   - **Pestaña 2:** Inscripción
     - Grado (solo lectura)
     - Sección (editable)
     - Jornada (editable)
     - Estado activo/inactivo
     - Observación (si está inactivo)
8. Usuario hace cambios y presiona "Guardar todos los cambios"
9. Sistema actualiza alumno e inscripción
10. Muestra mensaje de éxito

## Validaciones Implementadas

### BuscarAlumnoEditarModal
- ✅ Alumno seleccionado obligatorio
- ✅ Ciclo escolar obligatorio
- ✅ Manejo de respuestas vacías

### EditarAlumno
- ✅ Campos de contacto de emergencia opcionales
- ✅ Observación obligatoria cuando inscripción está inactiva
- ✅ Sección y jornada deben ser válidas del catálogo

### EditarFamiliaModal
- ✅ Validación de formulario con Ant Design Form
- ✅ Campos opcionales para responsables
- ✅ Manejo de responsables existentes vs nuevos

## Consideraciones Importantes

### Ciclo Escolar Automático
El sistema calcula automáticamente el ciclo escolar:
- De enero a octubre: año actual
- Noviembre y diciembre: año siguiente

```javascript
const obtenerCicloActual = () => {
  const hoy = new Date();
  const mes = hoy.getMonth();
  const año = hoy.getFullYear();
  if (mes >= 10) return (año + 1).toString();
  return año.toString();
};
```

### Estado de Inscripción
- **Activa:** No requiere observación
- **Inactiva:** Requiere observación obligatoria (motivo del retiro)

### Actualización de Responsables
- Si el responsable existe (tiene IdResponsable), se usa `PUT`
- Si no existe, se usa `POST` para crearlo
- Se mantiene el `IdResponsableTipo` correcto para cada tipo

## Próximas Mejoras Sugeridas

1. **Validación de DPI y NIT** con formato guatemalteco
2. **Confirmación antes de desactivar** una inscripción
3. **Historial de cambios** para auditoría
4. **Búsqueda avanzada** con más filtros (grado, sección, etc.)
5. **Validación de email** en formato correcto
6. **Máscara de teléfono** guatemalteco

## Testing Recomendado

- [ ] Buscar alumno existente con inscripción
- [ ] Buscar alumno sin inscripción en ciclo
- [ ] Editar datos de emergencia
- [ ] Cambiar sección y jornada
- [ ] Desactivar inscripción con observación
- [ ] Activar inscripción nuevamente
- [ ] Editar datos de familia
- [ ] Agregar responsable nuevo
- [ ] Editar responsable existente
- [ ] Verificar actualización en listados

## Notas de Implementación

- Se usa `apiClient` para todas las llamadas a la API
- Los mensajes de error y éxito usan `message` de Ant Design
- Los spinners indican carga de datos
- Los formularios usan `Form.useForm()` de Ant Design
- Se manejan errores con try-catch y logs en consola

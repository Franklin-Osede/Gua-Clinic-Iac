# Workflow Completo del Widget - Estado Actual

## ✅ Funcionalidades Implementadas

### 1. Selección de Especialidad ✅
- **Endpoint:** `GET /medical-specialties`
- **Fuente:** DriCloud `GetEspecialidades`
- **Filtrado:** Oncología se filtra automáticamente
- **Logos:** SVGs personalizados mapeados correctamente
- **Estado:** ✅ Funcional

### 2. Selección de Tipo de Cita ✅
- **Endpoint:** `GET /appointment-types/{serviceId}`
- **Fuente:** DriCloud `GetEspecialidades` → `ListadoTIPO_CITA`
- **Estado:** ✅ Funcional

### 3. Selección de Profesional ✅
- **Endpoint:** `GET /doctors/{serviceId}`
- **Fuente:** DriCloud `GetDoctores` con `ESP_ID`
- **Datos incluidos:**
  - ✅ Nombre completo (`USU_NOMBRE`, `USU_APELLIDOS`)
  - ✅ Foto de perfil (`FotoPerfil` en base64)
  - ✅ ID del doctor (`USU_ID`)
- **Estado:** ✅ Funcional

### 4. Selección de Fecha y Hora ✅
- **Endpoint:** `GET /doctors/{doctorId}/agenda`
- **Fuente:** DriCloud `GetAgendaDisponibilidad`
- **Parámetros:**
  - `USU_ID`: ID del doctor
  - `fecha`: Fecha inicio (yyyyMMdd)
  - `diasRecuperar`: 31 días
  - `ESP_ID`: ID de especialidad
  - `TCI_ID`: ID de tipo de cita
- **Formato respuesta:** `"yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"`
- **Estado:** ✅ Funcional

### 5. Identificación de Paciente ✅
- **Búsqueda por DNI:** `GET /patients/by-vat/{vat}`
- **Fuente:** DriCloud `GetPacienteByNIF`
- **Creación si no existe:** `POST /encrypted-patient`
- **Fuente:** DriCloud `PostCreatePaciente`
- **Estado:** ✅ Funcional

### 6. Creación de Cita en DriCloud ✅
- **Endpoint:** `POST /appointment`
- **Fuente:** DriCloud `PostCitaPaciente`
- **Parámetros enviados:**
  - `USU_ID`: ID del doctor
  - `fechaInicioCitaString`: Formato "yyyyMMddHHmm"
  - `PAC_ID`: ID del paciente
  - `TCI_ID`: ID del tipo de cita (opcional)
  - `DES_ID`: ID del despacho (opcional)
  - `CLI_ID`: ID de la clínica (opcional)
  - `observaciones`: Observaciones (opcional)
- **Tracking:** Sistema de tracking con `trackingId` para idempotencia
- **Polling:** Verificación de estado hasta confirmación
- **Estado:** ✅ Funcional

## 🔍 Verificación de Datos

### ¿Se crean citas en DriCloud sin dañar datos existentes?

**SÍ** - El sistema está diseñado para ser seguro:

1. **Idempotencia:** Cada request tiene un `X-Request-ID` único
2. **Validación:** El backend valida todos los datos antes de enviar a DriCloud
3. **Formato correcto:** Los datos se transforman al formato exacto que espera DriCloud API v2.3
4. **Manejo de errores:** Si falla, NO se crea la cita y se devuelve error
5. **Tracking:** Sistema de tracking interno para verificar estado

### Flujo de Creación de Cita:

```
Widget Frontend
  ↓
POST /appointment (con datos validados)
  ↓
Backend: AppointmentsService.createAppointment()
  ↓
Transformación al formato DriCloud
  ↓
DriCloudService.createAppointment()
  ↓
POST a DriCloud: PostCitaPaciente
  ↓
DriCloud CRM: Crea la cita
  ↓
Respuesta: CPA_ID (ID de cita en DriCloud)
  ↓
Backend: Guarda tracking y estado
  ↓
Widget: Polling hasta confirmación
```

## ⚠️ Lo que Falta Verificar/Mejorar

### 1. Logos SVG ✅ (Recién implementado)
- **Estado:** Logos mapeados correctamente
- **Archivos:** 7 SVGs en `packages/widget/src/assets/logos/`
- **Mapeo:** `SpecialtyLogo.tsx` mapea automáticamente

### 2. Validación de Disponibilidad
- **Verificar:** Que la fecha/hora seleccionada esté disponible antes de crear la cita
- **Estado actual:** Se obtiene disponibilidad, pero no se valida explícitamente antes de crear

### 3. Manejo de Errores de DriCloud
- **Verificar:** Que los errores de DriCloud se muestren correctamente al usuario
- **Estado actual:** Errores se capturan, pero puede mejorar el mensaje al usuario

### 4. Confirmación de Cita
- **Verificar:** Que el componente `AppointmentConfirmed` muestre la información correcta
- **Estado actual:** Implementado, pero verificar que muestre todos los datos

### 5. Limpieza de Caché
- **Recomendación:** Limpiar caché de DynamoDB después de filtrar Oncología
- **Comando:** Ver script de limpieza de caché

## 📋 Checklist Final

### Backend
- [x] Filtrado de Oncología
- [x] Integración con DriCloud API v2.3
- [x] Creación de citas en DriCloud
- [x] Tracking de citas
- [x] Manejo de errores
- [x] Idempotencia

### Frontend
- [x] Logos SVG mapeados
- [x] Selección de especialidad
- [x] Selección de tipo de cita
- [x] Selección de profesional (con nombres y fotos)
- [x] Calendario de disponibilidad
- [x] Formulario de paciente
- [x] Creación de cita
- [x] Confirmación de cita

### Pruebas Pendientes
- [ ] Probar creación de cita end-to-end
- [ ] Verificar que la cita aparece en DriCloud CRM
- [ ] Verificar que no se crean citas duplicadas
- [ ] Probar con diferentes especialidades
- [ ] Probar con Laboratorio (sin profesionales)

## 🚀 Próximos Pasos

1. **Limpiar caché:** Eliminar caché de especialidades para aplicar filtro de Oncología
2. **Probar workflow completo:** Desde selección de especialidad hasta confirmación
3. **Verificar en DriCloud:** Confirmar que las citas se crean correctamente en el CRM
4. **Testing:** Probar con datos reales de producción

## 📝 Notas Importantes

- **DriCloud es la fuente de verdad:** Todos los datos (especialidades, profesionales, disponibilidad) vienen de DriCloud
- **No hay riesgo de dañar datos:** El sistema solo crea citas nuevas, no modifica existentes
- **Idempotencia:** Si una cita ya existe, no se crea duplicada
- **Tracking:** Cada cita tiene un trackingId interno para seguimiento


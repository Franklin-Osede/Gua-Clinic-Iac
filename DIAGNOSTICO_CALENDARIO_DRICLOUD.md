# 🔍 Diagnóstico: Problema con Calendario - GetAgendaDisponibilidad

## 📋 Resumen del Problema

El calendario no muestra disponibilidad aunque otras llamadas a la API de DriCloud funcionan correctamente (especialidades, doctores, etc.).

## ✅ Parámetros que Estamos Enviando Actualmente

Según la documentación de DriCloud API v2.3, estamos enviando:

```typescript
{
  USU_ID: doctorId,           // ✅ Id del doctor (obligatorio si no se envía List_USU_ID)
  fecha: "yyyyMMdd",          // ✅ Fecha de inicio en formato yyyyMMdd
  diasRecuperar: 31            // ✅ Días a recuperar (entre 1 y 31)
}
```

### Código Actual (Backend)

**Endpoint:** `POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetAgendaDisponibilidad`

**Parámetros enviados:**
```typescript
{
  USU_ID: doctorId,              // Ejemplo: 56
  fecha: fechaFormatoDriCloud,   // Ejemplo: "20251101" (formato yyyyMMdd)
  diasRecuperar: datesToFetch    // Ejemplo: 31 (máximo permitido)
}
```

**Headers:**
```
USU_APITOKEN: <token obtenido del login>
```

## ❓ Parámetros Opcionales que NO Estamos Enviando

Según la documentación, estos parámetros son **opcionales** pero podrían ayudar:

1. **`DES_ID`** (int) - Id del despacho
   - Cada despacho está asociado a una clínica
   - Si el doctor tiene múltiples despachos, podría filtrar mejor

2. **`CLI_ID`** (int) - Id de la clínica
   - Cada especialidad está asociada a turnos abiertos en la agenda
   - Podría ayudar a filtrar disponibilidad por clínica específica

3. **`ESP_ID`** (int) - ID de la especialidad
   - Podría filtrar disponibilidad por especialidad específica
   - Útil si un doctor tiene múltiples especialidades

4. **`TCI_ID`** (int) - Id del tipo de cita
   - Si se pasa, busca huecos con duración mínima al establecido para ese tipo de cita
   - Podría ser útil para filtrar por duración

## 🔍 Preguntas para la Otra Agencia

### 1. Parámetros que Envían

**Pregunta:** ¿Qué parámetros exactos envían a `GetAgendaDisponibilidad`?

```json
{
  "USU_ID": ?,
  "fecha": ?,
  "diasRecuperar": ?,
  "DES_ID": ?,      // ¿Lo envían?
  "CLI_ID": ?,      // ¿Lo envían?
  "ESP_ID": ?,      // ¿Lo envían?
  "TCI_ID": ?       // ¿Lo envían?
}
```

### 2. Formato de Fecha

**Pregunta:** ¿Qué formato de fecha usan exactamente?
- ¿`"20251101"` (yyyyMMdd sin guiones)?
- ¿`"2025-11-01"` (con guiones)?
- ¿Otro formato?

**Nuestro código actual:** `"20251101"` (yyyyMMdd sin guiones)

### 3. Validación de Datos

**Pregunta:** ¿Cómo validan que hay datos disponibles antes de llamar a la API?
- ¿Verifican que el doctor tenga turnos abiertos?
- ¿Verifican que la especialidad tenga disponibilidad?
- ¿Verifican que el despacho esté activo?

### 4. Manejo de Respuestas Vacías

**Pregunta:** ¿Qué hacen cuando `GetAgendaDisponibilidad` devuelve un array vacío?
- ¿Es normal que devuelva `[]` si no hay disponibilidad?
- ¿O siempre debería devolver algo si el doctor tiene turnos configurados?

### 5. Estructura de Respuesta

**Pregunta:** ¿Qué estructura exacta reciben de DriCloud?

**Esperado según documentación:**
```json
{
  "Successful": true,
  "Data": {
    "Disponibilidad": [
      "202501151000:30:1:1",
      "202501151030:30:1:1"
    ]
  }
}
```

**Formato de cada slot:** `yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>`

### 6. Configuración en DriCloud

**Pregunta:** ¿Qué configuración específica tienen en DriCloud para que funcione?
- ¿Los doctores tienen turnos abiertos configurados?
- ¿Los despachos están asociados correctamente?
- ¿Las especialidades tienen tipos de cita configurados?

## 🧪 Tests que Podemos Hacer

### Test 1: Verificar que el doctor existe y tiene especialidades
```bash
curl -X GET "https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/doctors/1"
```

### Test 2: Llamar directamente a GetAgendaDisponibilidad con parámetros mínimos
```bash
# Con solo USU_ID, fecha y diasRecuperar
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetAgendaDisponibilidad
{
  "USU_ID": 56,
  "fecha": "20251101",
  "diasRecuperar": 7
}
```

### Test 3: Llamar con parámetros adicionales
```bash
# Con DES_ID, CLI_ID, ESP_ID
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetAgendaDisponibilidad
{
  "USU_ID": 56,
  "fecha": "20251101",
  "diasRecuperar": 7,
  "DES_ID": 1,
  "CLI_ID": 1,
  "ESP_ID": 1
}
```

## 📊 Información de Nuestro Código

### Endpoint del Backend
```
GET /doctor-availability/{doctorId}/{startDate}?dates_to_fetch={datesToFetch}
```

**Ejemplo:**
```
GET /doctor-availability/56/20251101?dates_to_fetch=31
```

### Código del Backend (dricloud.service.ts)
```typescript
const response = await this.httpService.post(
  `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/GetAgendaDisponibilidad`,
  {
    USU_ID: doctorId,
    fecha: fechaFormatoDriCloud,  // Formato: yyyyMMdd
    diasRecuperar: datesToFetch    // Entre 1 y 31
  },
  { 
    headers: { USU_APITOKEN: token },
    timeout: this.HTTP_TIMEOUT_MS
  }
);
```

### Código del Frontend (CalendarDatePicker.tsx)
```typescript
const data = await getDoctorAgenda(
  doctorId,                    // Ejemplo: 56
  formatStringFromDate(date),   // Formato: "yyyyMMdd"
  31                            // días a recuperar
);
```

## 🎯 Posibles Causas del Problema

1. **No hay datos en DriCloud**
   - El doctor no tiene turnos abiertos configurados
   - Los turnos están cerrados para esas fechas
   - No hay disponibilidad real

2. **Parámetros faltantes**
   - Quizás necesitamos enviar `DES_ID`, `CLI_ID` o `ESP_ID`
   - DriCloud podría requerir estos parámetros para filtrar correctamente

3. **Formato de fecha incorrecto**
   - Aunque usamos `yyyyMMdd`, podría haber un problema con la zona horaria
   - La fecha podría estar en el pasado según la hora de España peninsular

4. **Configuración en DriCloud**
   - Los turnos del doctor no están abiertos para esas fechas
   - El doctor no está asociado correctamente a la especialidad/clínica

## 📝 Checklist para Diagnosticar

- [ ] Verificar que el doctor existe: `GET /doctors/{serviceId}`
- [ ] Verificar que el doctor tiene especialidades asociadas
- [ ] Verificar que hay turnos abiertos en DriCloud para ese doctor
- [ ] Probar con diferentes fechas (hoy, mañana, dentro de 7 días)
- [ ] Probar con diferentes valores de `diasRecuperar` (1, 7, 31)
- [ ] Probar enviando `DES_ID`, `CLI_ID`, `ESP_ID` adicionales
- [ ] Verificar los logs del backend para ver la respuesta exacta de DriCloud
- [ ] Comparar con la otra agencia qué parámetros envían exactamente

## 🔗 Referencias

- Documentación DriCloud API v2.3 (proporcionada)
- Endpoint: `POST /api/APIWeb/GetAgendaDisponibilidad`
- Formato de salida: `"yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"`




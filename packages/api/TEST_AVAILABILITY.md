# Guía de Verificación de Disponibilidad y Sincronización

Esta guía explica cómo verificar que la disponibilidad de citas se sincroniza correctamente con DriCloud después de crear una cita.

## 📋 Índice

1. [Verificación con curl](#verificación-con-curl)
2. [Verificación con Postman](#verificación-con-postman)
3. [Flujo Completo de Prueba](#flujo-completo-de-prueba)
4. [Interpretación de Resultados](#interpretación-de-resultados)

---

## 🔧 Verificación con curl

### Paso 1: Inicializar Sesión

```bash
# Inicializar sesión y guardar cookies
curl -X GET "http://localhost:3000/bootstrap" \
  -H "Content-Type: application/json" \
  -c /tmp/gua_cookies.txt
```

### Paso 2: Obtener Disponibilidad ANTES de Crear Cita

```bash
# Obtener disponibilidad para un doctor (formato: doctorId/startDate)
curl -X GET "http://localhost:3000/doctor-availability/1/2025-01-15?dates_to_fetch=7" \
  -H "Content-Type: application/json" \
  -b /tmp/gua_cookies.txt
```

**Respuesta esperada:**
```json
[
  "202501151000:30:1:1",
  "202501151030:30:1:1",
  "202501151100:30:1:1",
  ...
]
```

**Formato del string:** `yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>`

### Paso 3: Crear una Cita

```bash
curl -X POST "http://localhost:3000/appointment" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test_$(date +%s)" \
  -b /tmp/gua_cookies.txt \
  -d '{
    "PAC_ID": 123,
    "USU_ID": 1,
    "FECHA": "2025-01-15",
    "HORA": "10:00",
    "OBSERVACIONES": "Cita de prueba"
  }'
```

**Respuesta esperada:**
```json
{
  "appointmentId": "456789",
  "trackingId": "appt_abc123...",
  "message": "Cita creada exitosamente",
  "appointment": {
    "PAC_ID": 123,
    "USU_ID": 1,
    "FECHA": "2025-01-15",
    "HORA": "10:00",
    "status": "confirmed"
  }
}
```

### Paso 4: Verificar Disponibilidad DESPUÉS de Crear Cita

```bash
# Obtener disponibilidad nuevamente (mismo doctor, misma fecha)
curl -X GET "http://localhost:3000/doctor-availability/1/2025-01-15?dates_to_fetch=7" \
  -H "Content-Type: application/json" \
  -b /tmp/gua_cookies.txt
```

**Verificación:**
- ✅ **ÉXITO**: El slot `202501151000` (10:00 del 15 de enero) NO debería aparecer en la lista
- ❌ **ERROR**: Si el slot todavía aparece, significa que no se sincronizó correctamente

### Script Automático

Usa el script incluido para una verificación más fácil:

```bash
cd gua-clinic-monorepo/packages/api
./test-availability.sh [API_BASE_URL] [DOCTOR_ID] [START_DATE]

# Ejemplo:
./test-availability.sh http://localhost:3000 1 2025-01-15
```

---

## 📮 Verificación con Postman

### 1. Obtener Disponibilidad

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:3000/doctor-availability/1/2025-01-15?dates_to_fetch=7`
- **Headers:**
  - `Content-Type: application/json`
- **Cookies:** (si usas cookies de sesión, agrégalas en la pestaña Cookies)

**Response:**
```json
[
  "202501151000:30:1:1",
  "202501151030:30:1:1",
  "202501151100:30:1:1"
]
```

### 2. Crear Cita

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:3000/appointment`
- **Headers:**
  - `Content-Type: application/json`
  - `X-Request-ID: test_123456789` (opcional, para idempotencia)
- **Body (raw JSON):**
```json
{
  "PAC_ID": 123,
  "USU_ID": 1,
  "FECHA": "2025-01-15",
  "HORA": "10:00",
  "OBSERVACIONES": "Cita de prueba desde Postman"
}
```

### 3. Verificar Disponibilidad Después

Repite el paso 1 y verifica que el slot `202501151000` ya no esté disponible.

---

## 🔄 Flujo Completo de Prueba

### Escenario 1: Verificar que una cita reservada desaparece de la disponibilidad

```bash
# 1. Inicializar sesión
curl -X GET "http://localhost:3000/bootstrap" -c /tmp/cookies.txt

# 2. Obtener disponibilidad ANTES
BEFORE=$(curl -s -X GET "http://localhost:3000/doctor-availability/1/2025-01-15?dates_to_fetch=7" \
  -b /tmp/cookies.txt)

# 3. Extraer primer slot disponible
FIRST_SLOT=$(echo "$BEFORE" | grep -oE '[0-9]{12}' | head -1)
echo "Slot a reservar: $FIRST_SLOT"

# 4. Parsear fecha/hora
YEAR=${FIRST_SLOT:0:4}
MONTH=${FIRST_SLOT:4:2}
DAY=${FIRST_SLOT:6:2}
HOUR=${FIRST_SLOT:8:2}
MINUTE=${FIRST_SLOT:10:2}

# 5. Crear cita
curl -X POST "http://localhost:3000/appointment" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test_$(date +%s)" \
  -b /tmp/cookies.txt \
  -d "{
    \"PAC_ID\": 123,
    \"USU_ID\": 1,
    \"FECHA\": \"$YEAR-$MONTH-$DAY\",
    \"HORA\": \"$HOUR:$MINUTE\",
    \"OBSERVACIONES\": \"Cita de prueba\"
  }"

# 6. Esperar 2 segundos (para que DriCloud procese)
sleep 2

# 7. Obtener disponibilidad DESPUÉS
AFTER=$(curl -s -X GET "http://localhost:3000/doctor-availability/1/2025-01-15?dates_to_fetch=7" \
  -b /tmp/cookies.txt)

# 8. Verificar
if echo "$AFTER" | grep -q "$FIRST_SLOT"; then
  echo "❌ ERROR: El slot reservado todavía aparece"
  exit 1
else
  echo "✅ ÉXITO: El slot reservado ya no está disponible"
fi
```

---

## 📊 Interpretación de Resultados

### ✅ Casos de Éxito

1. **Slot desaparece correctamente:**
   - Antes: `["202501151000:30:1:1", "202501151030:30:1:1"]`
   - Después: `["202501151030:30:1:1"]` (el slot de 10:00 ya no está)

2. **Múltiples citas se reflejan:**
   - Si reservas 3 citas diferentes, todas deben desaparecer de la disponibilidad

### ❌ Casos de Error

1. **Slot todavía aparece:**
   - **Posible causa:** DriCloud no procesó la cita aún (esperar 2-5 segundos)
   - **Solución:** Hacer polling del estado de la cita antes de verificar

2. **Error 401 al obtener disponibilidad:**
   - **Posible causa:** Sesión expirada
   - **Solución:** Reinicializar sesión con `/bootstrap`

3. **Array vacío:**
   - **Posible causa:** No hay disponibilidad para ese doctor/fecha
   - **Solución:** Verificar que el doctor tenga horarios configurados en DriCloud

---

## 🔍 Troubleshooting

### Problema: "No puedo obtener disponibilidad"

**Solución:**
1. Verificar que el backend esté corriendo: `curl http://localhost:3000/health`
2. Verificar que las credenciales de DriCloud estén configuradas correctamente
3. Revisar logs del backend para ver errores de conexión con DriCloud

### Problema: "Las citas no desaparecen de la disponibilidad"

**Solución:**
1. Verificar que la cita se creó correctamente en DriCloud (revisar respuesta del endpoint)
2. Esperar 2-5 segundos después de crear la cita antes de verificar
3. Verificar que el `doctorId` y la fecha/hora coincidan exactamente

### Problema: "Error al crear cita"

**Solución:**
1. Verificar que el `PAC_ID` existe en DriCloud
2. Verificar que la fecha/hora esté en el futuro
3. Verificar que el formato de fecha sea `YYYY-MM-DD` y hora sea `HH:MM`

---

## 📝 Notas Importantes

1. **Timezone:** DriCloud usa `Europe/Madrid` - asegúrate de que las fechas estén en ese timezone
2. **Formato de fecha:** 
   - Para obtener disponibilidad: `YYYY-MM-DD` (ej: `2025-01-15`)
   - Para crear cita: `YYYY-MM-DD` para fecha, `HH:MM` para hora
3. **Idempotencia:** Usa el header `X-Request-ID` para evitar crear citas duplicadas si hay reintentos
4. **Sesión:** El endpoint `/bootstrap` crea una sesión con cookies httpOnly - guarda las cookies entre requests

---

## 🎯 Checklist de Verificación

- [ ] Puedo obtener disponibilidad de un doctor
- [ ] Puedo crear una cita exitosamente
- [ ] El slot reservado desaparece de la disponibilidad
- [ ] Múltiples citas se reflejan correctamente
- [ ] El calendario se actualiza automáticamente después de crear cita (frontend)
- [ ] No hay duplicados si uso el mismo `X-Request-ID`

---

¿Necesitas ayuda? Revisa los logs del backend o contacta al equipo de desarrollo.







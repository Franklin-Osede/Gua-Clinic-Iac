# 📋 Cómo Revisar Logs del Backend

## 🎯 Objetivo
Revisar los logs para diagnosticar el error 500 en `/doctor-availability/56/20251101`

---

## 🔍 Opción 1: Backend Local (Desarrollo)

### Si el backend está corriendo localmente:

1. **Abre la terminal donde está corriendo el backend**
   ```bash
   cd packages/api
   npm run start:dev
   ```

2. **Busca estos mensajes específicos** cuando ocurra el error:

   ```
   🔍 Busca estos mensajes:
   
   ✅ INFORMACIÓN:
   - "🎯 DoctorAvailabilityController.getDoctorAgenda called"
   - "🔍 DoctorAvailabilityService.getDoctorAgenda called with:"
   - "📅 Requesting agenda for doctor 56"
   - "📅 Converted date 20251101 -> 20251101"
   
   ❌ ERRORES (lo que necesitamos):
   - "❌ Error en DoctorAvailabilityController.getDoctorAgenda"
   - "❌ Error stack:"
   - "❌ Error en petición a DriCloud GetAgendaDisponibilidad"
   - "❌ getDoctorAgenda: doctorId inválido"
   - "Request blocked by rate limiting"
   - "Circuit breaker fallback activated"
   ```

3. **Copia y pega TODOS los mensajes** que aparezcan cuando ocurre el error

---

## 🌐 Opción 2: Backend en AWS (Producción)

### Si estás usando la API Gateway de producción:

1. **Revisar logs de CloudWatch**:

   ```bash
   cd packages/api
   ./view-cloudwatch-logs.sh
   ```

   O manualmente:
   ```bash
   aws logs tail /aws/ecs/gua-clinic-api --follow --region eu-north-1
   ```

2. **Buscar errores específicos**:

   ```bash
   # Filtrar solo errores relacionados con doctor-availability
   aws logs filter-log-events \
     --log-group-name /aws/ecs/gua-clinic-api \
     --region eu-north-1 \
     --filter-pattern "doctor-availability" \
     --start-time $(date -u -d '1 hour ago' +%s)000
   ```

3. **Buscar errores de DriCloud**:

   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/ecs/gua-clinic-api \
     --region eu-north-1 \
     --filter-pattern "GetAgendaDisponibilidad" \
     --start-time $(date -u -d '1 hour ago' +%s)000
   ```

---

## 🧪 Opción 3: Probar el Endpoint Directamente

### Probar con curl para ver el error completo:

**Local:**
```bash
curl -v -X GET \
  'http://localhost:3000/doctor-availability/56/20251101?dates_to_fetch=31' \
  -H 'accept: application/json'
```

**Producción (API Gateway):**
```bash
curl -v -X GET \
  'https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/doctor-availability/56/20251101?dates_to_fetch=31' \
  -H 'accept: application/json'
```

El flag `-v` mostrará:
- Headers de respuesta
- Código de estado HTTP
- Body de respuesta (si hay)
- Información de tiempo de respuesta

---

## 📊 Información Específica que Necesito

Cuando revises los logs, por favor comparte:

### 1. **Mensajes de Error** (❌)
```
Copia TODOS los mensajes que empiecen con:
- "❌ Error en DoctorAvailabilityController"
- "❌ Error en DoctorAvailabilityService"
- "❌ Error en petición a DriCloud"
- "❌ getDoctorAgenda"
```

### 2. **Error Stack** (si aparece)
```
El stack trace completo que muestre:
- Dónde se originó el error
- Qué función lo causó
- Línea de código (si es posible)
```

### 3. **Mensajes de Rate Limiting** (si aparecen)
```
- "Request blocked by rate limiting"
- "Rate limit exceeded"
- Cualquier mensaje sobre rate limiting
```

### 4. **Mensajes de Token/Autenticación** (si aparecen)
```
- "Token conflict detected"
- "Refreshing DriCloud token"
- "USU_APITOKEN"
- Cualquier mensaje sobre autenticación
```

### 5. **Respuesta de DriCloud** (si aparece)
```
- "GetAgendaDisponibilidad response received"
- "DriCloud returned Successful: false"
- Cualquier mensaje sobre la respuesta de DriCloud
```

### 6. **Código de Estado HTTP Exacto**
```
- ¿Es 500 exactamente?
- ¿O es 502, 503, timeout?
- ¿Aparece algún mensaje de timeout?
```

### 7. **Parámetros que se enviaron**
```
Busca estos mensajes para confirmar:
- "🎯 DoctorAvailabilityController.getDoctorAgenda called: { doctorId: 56, startDate: '20251101', datesToFetch: 31 }"
- "📅 Requesting agenda for doctor 56, date: 20251101, days: 31"
```

---

## 🚀 Script de Ayuda

He creado un script que te ayudará:

```bash
cd packages/api
./check-error-logs.sh 56 20251101
```

Este script te mostrará:
- Dónde buscar los logs
- Qué mensajes específicos buscar
- Comandos para probar el endpoint

---

## 💡 Tips

1. **Si no ves logs**: Asegúrate de que el backend esté corriendo
2. **Si los logs son muy largos**: Filtra buscando "doctor-availability" o "GetAgendaDisponibilidad"
3. **Si es producción**: Los logs pueden tardar unos segundos en aparecer en CloudWatch
4. **Captura todo**: Mejor tener demasiada información que poca

---

## 📝 Ejemplo de lo que Necesito

Cuando encuentres los logs, comparte algo como esto:

```
❌ Error en DoctorAvailabilityController.getDoctorAgenda: Error: Rate limit exceeded
❌ Error stack: 
    at DriCloudService.makeDriCloudRequest (dricloud.service.ts:183)
    at DriCloudService.getDoctorAgenda (dricloud.service.ts:594)
    ...

Request blocked by rate limiting: Too many requests in last 30 seconds
```

O:

```
❌ Error en petición a DriCloud GetAgendaDisponibilidad: Request failed with status code 500
📅 Requesting agenda for doctor 56, date: 20251101, days: 31
```

---

## ✅ Después de Revisar

Una vez que tengas la información, compártela conmigo y podré:
1. Identificar la causa exacta del problema
2. Proponer una solución específica
3. Implementar el fix necesario







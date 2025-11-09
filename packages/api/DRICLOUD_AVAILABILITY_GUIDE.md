# Guía de Disponibilidad de DriCloud - Obtener 2 Meses de Datos

## 📋 Resumen

Según la documentación oficial de DriCloud API v2.3, el parámetro `diasRecuperar` en el endpoint `GetAgendaDisponibilidad` acepta valores entre **1 y 31 días** únicamente.

Para obtener disponibilidad para **2 meses (60 días)**, es necesario hacer **múltiples llamadas** a la API.

## 🔍 Formato de Respuesta de DriCloud

El endpoint `GetAgendaDisponibilidad` devuelve datos en el siguiente formato:

```json
{
  "Successful": true,
  "Data": {
    "Disponibilidad": [
      "202501151000:30:1:1",
      "202501151030:30:1:1",
      "202501151100:30:1:1"
    ]
  }
}
```

### Formato de cada slot:
```
yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>
```

**Ejemplo:** `202501151000:30:1:1`
- `20250115` = Fecha: 15 de enero de 2025
- `1000` = Hora: 10:00
- `30` = Duración de la cita en minutos
- `1` = ID del despacho
- `1` = ID del doctor

## 📅 Estrategia para Obtener 2 Meses de Datos

### Opción 1: Dos Llamadas Secuenciales (Recomendado)

```typescript
// Primera llamada: próximos 31 días
const today = new Date();
const firstCall = await getDoctorAgenda(doctorId, formatDate(today), 31);

// Segunda llamada: días 32-62
const date31DaysLater = new Date(today);
date31DaysLater.setDate(today.getDate() + 31);
const secondCall = await getDoctorAgenda(doctorId, formatDate(date31DaysLater), 31);

// Combinar resultados
const allAvailability = [
  ...firstCall.Data.Disponibilidad,
  ...secondCall.Data.Disponibilidad
];
```

### Opción 2: Llamadas Dinámicas por Mes

```typescript
async function getTwoMonthsAvailability(doctorId: number) {
  const today = new Date();
  const allAvailability: string[] = [];
  
  // Obtener datos para los próximos 2 meses
  for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() + monthOffset);
    startDate.setDate(1); // Primer día del mes
    
    // DriCloud permite máximo 31 días, así que obtenemos todo el mes
    const daysInMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0
    ).getDate();
    
    const daysToFetch = Math.min(daysInMonth, 31);
    
    const result = await getDoctorAgenda(
      doctorId,
      formatDate(startDate),
      daysToFetch
    );
    
    if (result.Successful && result.Data.Disponibilidad) {
      allAvailability.push(...result.Data.Disponibilidad);
    }
  }
  
  return allAvailability;
}
```

## ✅ Verificación de Datos

### Script de Prueba

Ejecuta el script de prueba para verificar que los datos están llegando correctamente:

```bash
cd packages/api
./test-dricloud-availability.sh
```

Este script:
1. Inicializa sesión
2. Obtiene especialidades
3. Obtiene doctores
4. Prueba disponibilidad para cada doctor con máximo de días (31)
5. Verifica el formato de respuesta
6. Muestra un resumen de resultados

### Prueba Manual con curl

```bash
# 1. Inicializar sesión
curl -X GET "http://localhost:3000/bootstrap" \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt

# 2. Obtener disponibilidad (máximo 31 días)
curl -X GET "http://localhost:3000/doctor-availability/1/2025-01-15?dates_to_fetch=31" \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt

# 3. Obtener siguiente mes (días 32-62)
curl -X GET "http://localhost:3000/doctor-availability/1/2025-02-15?dates_to_fetch=31" \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt
```

## 🔧 Implementación en el Widget

### CalendarDatePicker Component

El componente `CalendarDatePicker.tsx` debería:

1. **Hacer múltiples llamadas** si necesita más de 31 días:
```typescript
const fetchTwoMonthsAvailability = async (doctorId: number) => {
  const today = new Date();
  const results = [];
  
  // Primera llamada: próximos 31 días
  const firstBatch = await getDoctorAgenda(
    doctorId,
    formatStringFromDate(today),
    31
  );
  results.push(...firstBatch);
  
  // Segunda llamada: siguientes 31 días
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 31);
  const secondBatch = await getDoctorAgenda(
    doctorId,
    formatStringFromDate(nextMonth),
    31
  );
  results.push(...secondBatch);
  
  return results;
};
```

2. **Parsear correctamente el formato** de respuesta:
```typescript
const parseAvailabilitySlot = (slot: string) => {
  // Formato: "yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"
  const [datetime, minCita, desId, usuId] = slot.split(':');
  
  const year = parseInt(datetime.slice(0, 4), 10);
  const month = parseInt(datetime.slice(4, 6), 10) - 1;
  const day = parseInt(datetime.slice(6, 8), 10);
  const hour = parseInt(datetime.slice(8, 10), 10);
  const minute = parseInt(datetime.slice(10, 12), 10);
  
  return {
    date: new Date(year, month, day, hour, minute),
    duration: parseInt(minCita, 10),
    officeId: parseInt(desId, 10),
    doctorId: parseInt(usuId, 10)
  };
};
```

## ⚠️ Limitaciones de la API

1. **Máximo 31 días por llamada**: No se puede solicitar más de 31 días en una sola llamada
2. **Formato de fecha**: Debe ser `yyyyMMdd` (sin guiones)
3. **Timeout**: La API tiene un timeout de 10 segundos configurado
4. **Rate limiting**: Respetar los límites de rate limiting configurados

## 📊 Monitoreo

Para verificar que los datos están llegando correctamente:

1. **Logs del servidor**: Buscar logs con `GetAgendaDisponibilidad`
2. **CloudWatch Metrics**: Verificar métricas de DriCloud
3. **Script de prueba**: Ejecutar `test-dricloud-availability.sh` regularmente

## 🎯 Mejores Prácticas

1. **Cachear resultados**: Los datos de disponibilidad no cambian frecuentemente
2. **Hacer llamadas en paralelo**: Si necesitas múltiples meses, haz las llamadas en paralelo
3. **Validar formato**: Siempre validar que el formato de respuesta sea el esperado
4. **Manejar errores**: Implementar retry logic para errores temporales
5. **Actualizar después de reservas**: Refrescar disponibilidad después de crear una cita






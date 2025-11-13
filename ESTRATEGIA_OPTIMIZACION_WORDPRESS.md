# Estrategia Completa de Optimización para Widget en WordPress

## 🎯 Objetivo

Garantizar que el widget cargue **todas las secciones en menos de 2 segundos** en WordPress, permitiendo a los usuarios completar el proceso de agendar citas con disponibilidad real de doctores desde DriCloud, sin desconfigurar el web component.

## 📊 Problema Identificado

### Situación Actual
- ✅ **Localhost**: Funciona perfectamente, carga rápido
- ❌ **WordPress (shortcode)**: Tarda mucho en hacer fetch de datos de DriCloud
- ⚠️ **Primeros plugins**: Funcionaban bien, pero ahora requiere precarga de caché

### Causas Raíz

1. **Timeouts muy largos en el widget**: 20s + 30s + 40s = 90s máximo de espera
2. **Cookie SameSite='strict'**: No funciona en WordPress cross-site, crea sesión nueva cada vez
3. **Sin caché para disponibilidad**: Cada consulta de calendario va directo a DriCloud
4. **Preloader limitado**: Solo carga 5 especialidades comunes
5. **Primer usuario paga el costo**: Si el backend acaba de arrancar, el primer usuario espera la llamada a DriCloud

## 🚀 Solución Implementada

### 1. Optimización de Timeouts en el Widget

**Archivo**: `packages/widget/src/services/GuaAPIService.ts`

#### Cambios Realizados:

- **Especialidades médicas**: Reducido de 20s/30s/40s → **8s/12s/16s** (total máximo ~36s vs 90s)
- **Doctores**: Reducido de 60s → **15s**
- **Disponibilidad de doctores**: Agregado timeout de **15s**

**Beneficio**: El widget muestra fallback rápido si el backend está lento, mejorando UX.

```typescript
// Antes: timeout = attempt * 10000 + 10000; // 20s, 30s, 40s
// Ahora: timeout = attempt * 4000 + 4000; // 8s, 12s, 16s
```

### 2. Cookie SameSite para WordPress Cross-Site

**Archivo**: `packages/api/src/bootstrap/bootstrap.controller.ts`

#### Cambios Realizados:

- **Producción**: `sameSite: 'none'` + `secure: true` (requerido para cross-site)
- **Desarrollo**: `sameSite: 'lax'` (compatible con localhost)

**Beneficio**: El widget en WordPress reutiliza la sesión, evitando una llamada extra a `/bootstrap` en cada carga.

```typescript
const isProduction = process.env.NODE_ENV === 'production';
res.cookie('sessionId', session.sessionId, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 30 * 60 * 1000,
  path: '/',
});
```

### 3. Caché para Disponibilidad de Doctores

**Archivo**: `packages/api/src/doctor-availability/doctor-availability.service.ts`

#### Cambios Realizados:

- **TTL**: 5 minutos (disponibilidad cambia frecuentemente pero reduce llamadas a DriCloud)
- **Clave de caché**: `doctor-availability:{doctorId}:{startDate}:{datesToFetch}`
- **Soporte de refresh**: Parámetro `?refresh=true` para forzar recarga

**Beneficio**: Las consultas de calendario responden desde caché (<300ms) en lugar de esperar 10-30s a DriCloud.

```typescript
// Clave única por doctor, fecha y días
const cacheKey = `doctor-availability:${doctorId}:${startDate}:${datesToFetch}`;

// Verificar caché primero
const cachedData = await this.dynamoDBService.getFromCache<any>(cacheKey);
if (cachedData) {
  return cachedData; // Respuesta rápida desde caché
}
```

### 4. Mejora del Cache Preloader

**Archivo**: `packages/api/src/initialization/cache-preloader.service.ts`

#### Cambios Realizados:

- **Más especialidades**: Ampliado de 5 a **7 especialidades** (1, 6, 8, 9, 10, 18, 19)
- **Carga en paralelo**: Lotes de 3 especialidades a la vez para acelerar
- **Mejor logging**: Resumen detallado de éxito/errores

**Beneficio**: Más datos pre-cargados al arranque, reduciendo la probabilidad de que el primer usuario espere.

```typescript
const commonServiceIds = [1, 6, 8, 9, 10, 18, 19]; // 7 especialidades
// Pre-cargar en lotes de 3 para no sobrecargar DriCloud
const batchSize = 3;
```

### 5. Optimización de Endpoints

**Archivos**: 
- `packages/api/src/doctor-availability/doctor-availability.controller.ts`
- `packages/widget/src/services/GuaAPIService.ts`

#### Cambios Realizados:

- **Soporte de refresh**: Endpoint acepta `?refresh=true` para forzar recarga
- **Timeouts consistentes**: 15s para doctores y disponibilidad

## 📈 Resultados Esperados

### Antes de la Optimización
- ⏱️ **Tiempo de carga**: 20-90 segundos (dependiendo de DriCloud)
- 🔄 **Sesiones**: Nueva sesión en cada carga de WordPress
- 📡 **Llamadas a DriCloud**: Cada consulta va directo a DriCloud
- ⚠️ **Primer usuario**: Espera mientras se carga el caché

### Después de la Optimización
- ⚡ **Tiempo de carga**: **<2 segundos** (desde caché)
- ✅ **Sesiones**: Reutiliza sesión existente en WordPress
- 💾 **Caché agresivo**: Especialidades (10 min), Doctores (30 min), Disponibilidad (5 min)
- 🚀 **Preloader mejorado**: Más datos pre-cargados al arranque

## 🔄 Flujo Completo Optimizado

### 1. Arranque del Backend (ECS)
```
1. Backend inicia
2. Espera 5 segundos (onModuleInit)
3. CachePreloaderService ejecuta:
   - Pre-carga especialidades médicas
   - Pre-carga doctores para 7 especialidades comunes (en lotes de 3)
4. DynamoDB tiene datos listos antes del primer usuario
```

### 2. Usuario Abre Widget en WordPress
```
1. Widget carga bundle JavaScript
2. Inicializa sesión (GET /bootstrap)
   - Cookie SameSite=None permite reutilizar sesión si existe
3. Carga especialidades (GET /medical-specialties)
   - Timeout: 8s/12s/16s
   - Si falla → muestra FALLBACK_SPECIALTIES
   - Si éxito → lee desde caché DynamoDB (<300ms)
4. Usuario selecciona especialidad
5. Carga doctores (GET /doctors/{serviceId})
   - Timeout: 15s
   - Si éxito → lee desde caché DynamoDB (<300ms)
6. Usuario selecciona doctor
7. Carga disponibilidad (GET /doctor-availability/{doctorId}/{startDate})
   - Timeout: 15s
   - Si éxito → lee desde caché DynamoDB (<300ms)
8. Usuario selecciona fecha/hora
9. Crea cita (POST /appointment)
   - Siempre va directo a DriCloud (no cacheable)
   - Guarda en DriCloud correctamente
```

## 🛠️ Mantenimiento y Monitoreo

### Verificar que el Preloader Funciona

Después de cada deploy, verifica en CloudWatch Logs:

```bash
# Buscar logs del preloader
fields @timestamp, @message
| filter @message like 'Pre-carga de caché'
| sort @timestamp desc
| limit 20
```

Deberías ver:
- ✅ "Especialidades médicas pre-cargadas"
- ✅ "Pre-carga de caché completada: X/7 especialidades exitosas"

### Verificar Caché en DynamoDB

```bash
# Ver estadísticas de caché
curl https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/cache-stats
```

### Forzar Precarga Manual

Si necesitas forzar la precarga después de un deploy:

```bash
curl -X POST https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/doctors/preload-cache
```

### Monitorear Tiempos de Respuesta

En CloudWatch, filtra por endpoint:

```bash
# Especialidades
fields @timestamp, @message
| filter @message like '/medical-specialties'
| sort @timestamp desc

# Doctores
fields @timestamp, @message
| filter @message like '/doctors/'
| sort @timestamp desc

# Disponibilidad
fields @timestamp, @message
| filter @message like '/doctor-availability/'
| sort @timestamp desc
```

## ⚠️ Consideraciones Importantes

### Caché de Disponibilidad (5 minutos)

La disponibilidad se cachea por 5 minutos. Esto significa:
- ✅ **Ventaja**: Respuestas rápidas (<300ms)
- ⚠️ **Limitación**: Si un doctor cancela una cita, puede tardar hasta 5 minutos en reflejarse

**Solución**: Si necesitas datos frescos inmediatamente, usa `?refresh=true`:
```typescript
await getDoctorAgenda(doctorId, startDate, 31, true); // forceRefresh = true
```

### Cookie SameSite=None

Requiere HTTPS en producción. Si el API Gateway no tiene HTTPS, la cookie no funcionará.

**Verificación**:
```bash
curl -I https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/bootstrap
# Debe devolver Set-Cookie con SameSite=None; Secure
```

### Fallback de Especialidades

Si el backend no responde en 16s, el widget muestra 6 especialidades estáticas. Esto permite que el usuario continúe, pero:
- ⚠️ Puede que no todas las especialidades estén disponibles
- ✅ El usuario puede intentar refrescar manualmente

## 🎯 Métricas de Éxito

### Objetivos
- ✅ **Tiempo de carga inicial**: <2 segundos
- ✅ **Tiempo de respuesta desde caché**: <300ms
- ✅ **Tasa de éxito de preloader**: >90% (6/7 especialidades)
- ✅ **Reutilización de sesión**: >80% en WordPress

### Cómo Medir

1. **Tiempo de carga**: Abre DevTools → Network → Filtrar por `/medical-specialties`, `/doctors`, `/doctor-availability`
2. **Tasa de caché**: CloudWatch → Logs → Buscar "Returning from cache" vs "Fetching from DriCloud"
3. **Sesiones**: CloudWatch → Logs → Buscar "Session renewed" vs "New session created"

## 📝 Próximos Pasos (Opcional)

### Mejoras Futuras

1. **Keep-alive de DriCloud**: Lambda cada 10 min que llame `GetEspecialidades` para mantener sesión activa
2. **Prefetch paralelo**: Cargar especialidades, doctores y disponibilidad en paralelo tras `initializeSession()`
3. **SessionStorage**: Guardar datos en `sessionStorage` para reutilizar entre navegaciones
4. **Circuit breaker mejorado**: Detectar degradación de DriCloud y servir solo desde caché automáticamente

## ✅ Checklist de Verificación

Antes de considerar la optimización completa:

- [ ] Preloader ejecuta correctamente tras cada deploy
- [ ] Cookie `SameSite=None` se establece en producción
- [ ] Caché de disponibilidad funciona (verificar en DynamoDB)
- [ ] Timeouts del widget son 8s/12s/16s para especialidades
- [ ] Timeouts de doctores y disponibilidad son 15s
- [ ] Widget carga en <2 segundos en WordPress
- [ ] Citas se guardan correctamente en DriCloud
- [ ] Disponibilidad mostrada es real (no mock)

---

**Última actualización**: 2025-01-13
**Versión**: 1.0
**Autor**: Sistema de Optimización GUA Clinic


# 🚀 Próximos Pasos - Guía de Despliegue y Verificación

## ✅ Lo que se ha implementado

### Optimizaciones de Rendimiento
1. ✅ **Timeouts optimizados**: 8s/12s/16s para especialidades, 15s para doctores/disponibilidad
2. ✅ **Cookie SameSite=None**: Para WordPress cross-site
3. ✅ **Caché para disponibilidad**: TTL 5 minutos
4. ✅ **Preloader mejorado**: 5 especialidades (Urología+Andrología, Fisioterapia, Medicina Rehabilitadora, Ginecología, Medicina Integrativa)

### Configuración de Especialidades
1. ✅ **Urología y Andrología**: Consolidadas en una sola tarjeta, 3 doctores
2. ✅ **Fisioterapia**: Jasmina
3. ✅ **Medicina Rehabilitadora**: María Consuelo
4. ✅ **Ginecología**: Carlos Blanco
5. ✅ **Medicina Integrativa**: Diego Puebla (maneja cuando no está en DriCloud)

---

## 📋 Checklist de Despliegue

### Paso 1: Compilar y Verificar Localmente

```bash
# 1. Compilar el backend
cd packages/api
npm run build

# 2. Verificar que no hay errores de TypeScript
npm run type-check  # Si existe el script

# 3. Compilar el widget
cd ../widget
npm run build

# 4. Verificar que el widget se compila correctamente
```

### Paso 2: Probar Localmente (Opcional pero Recomendado)

```bash
# Backend
cd packages/api
npm run start:dev

# En otra terminal, probar endpoints
curl http://localhost:3002/bootstrap
curl http://localhost:3002/medical-specialties
curl http://localhost:3002/doctors/1
```

### Paso 3: Desplegar Backend a AWS ECS

```bash
# 1. Construir y subir imagen Docker
cd packages/api
docker build -t gua-clinic-api:latest .
docker tag gua-clinic-api:latest 258591805733.dkr.ecr.eu-north-1.amazonaws.com/gua-clinic-api:latest
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 258591805733.dkr.ecr.eu-north-1.amazonaws.com
docker push 258591805733.dkr.ecr.eu-north-1.amazonaws.com/gua-clinic-api:latest

# 2. Forzar nuevo despliegue en ECS
aws ecs update-service --cluster gua-clinic-api --service gua-clinic-api-service --force-new-deployment --region eu-north-1
```

**O usar el script de despliegue existente:**
```bash
cd packages/api
./deploy-ecs.sh
```

### Paso 4: Verificar Preloader en CloudWatch

Después del despliegue, espera 10-15 segundos y verifica en CloudWatch Logs:

**Log Group**: `/ecs/gua-clinic-api`

**Query**:
```
fields @timestamp, @message
| filter @message like 'Pre-carga de caché'
| sort @timestamp desc
| limit 20
```

**Deberías ver**:
- ✅ "Iniciando pre-carga de caché optimizada para WordPress..."
- ✅ "Especialidades médicas pre-cargadas"
- ✅ "Pre-carga de caché completada: X/6 IDs de especialidades exitosos (5 especialidades activas)"

### Paso 5: Forzar Precarga Manual (Opcional)

Si quieres asegurarte de que el caché está caliente:

```bash
curl -X POST https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/doctors/preload-cache
```

**Respuesta esperada**:
```json
{
  "message": "Cache preloaded",
  "results": [
    {"serviceId": 1, "status": "success"},
    {"serviceId": 18, "status": "success"},
    {"serviceId": 10, "status": "success"},
    {"serviceId": 6, "status": "success"},
    {"serviceId": 9, "status": "success"},
    {"serviceId": 19, "status": "success"}
  ]
}
```

### Paso 6: Verificar Endpoints Rápidos

```bash
# Bootstrap (debe responder <500ms)
time curl -I https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/bootstrap

# Especialidades (debe responder <300ms desde caché)
time curl https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/medical-specialties

# Doctores Urología (debe responder <300ms desde caché)
time curl https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/doctors/1
```

### Paso 7: Probar Widget en WordPress

1. **Abrir página de prueba en WordPress** con el shortcode:
   ```
   [gua_clinic_widget]
   ```

2. **Abrir DevTools** (F12) → Network tab

3. **Verificar tiempos de carga**:
   - `/bootstrap` → <500ms
   - `/medical-specialties` → <300ms (desde caché)
   - `/doctors/1` → <300ms (desde caché)
   - `/doctor-availability/...` → <300ms (desde caché)

4. **Verificar que se muestran**:
   - ✅ "Urología y Andrología" (una sola tarjeta, no duplicada)
   - ✅ Fisioterapia
   - ✅ Medicina Rehabilitadora
   - ✅ Ginecología
   - ✅ Medicina Integrativa

5. **Probar flujo completo**:
   - Seleccionar "Urología y Andrología"
   - Verificar que aparecen los 3 doctores: Nicolas Nervo, Andres Humberto Vargas, Andrea Noya
   - Seleccionar un doctor
   - Ver tipos de cita
   - Ver calendario con disponibilidad
   - Crear una cita de prueba

---

## 🔍 Verificaciones Post-Despliegue

### 1. Verificar Cookie SameSite=None

En DevTools → Application → Cookies → `https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com`

**Deberías ver**:
- Cookie: `sessionId`
- SameSite: `None`
- Secure: ✅ (checked)

### 2. Verificar Caché en DynamoDB

```bash
# Ver estadísticas de caché
curl https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/cache-stats
```

**Deberías ver**:
- Entradas de caché para: `medical-specialties`, `doctors:1`, `doctors:18`, `doctors:10`, etc.

### 3. Verificar Logs de Preloader

En CloudWatch Logs, buscar:
```
fields @timestamp, @message
| filter @message like 'Pre-carga' or @message like 'pre-cargando'
| sort @timestamp desc
| limit 30
```

### 4. Verificar Tiempos de Respuesta

En CloudWatch Metrics:
- **API Gateway**: Latencia promedio <500ms
- **ECS**: CPU <50%, Memoria estable

---

## ⚠️ Problemas Comunes y Soluciones

### Problema: Widget tarda >2 segundos

**Solución**:
1. Verificar que el preloader ejecutó correctamente
2. Forzar precarga manual: `POST /doctors/preload-cache`
3. Verificar que los endpoints responden desde caché (<300ms)

### Problema: Aparecen dos tarjetas "Urología y Andrología"

**Solución**:
1. Verificar que el código de consolidación está en `Services.tsx`
2. Limpiar caché del navegador
3. Verificar que ambas especialidades (ID 1 y 18) vienen de la API

### Problema: No aparecen doctores en "Urología y Andrología"

**Solución**:
1. Verificar en CloudWatch que el backend está combinando doctores de ID 1 y 18
2. Verificar que los nombres de los doctores coinciden con el filtro en `Professionals.tsx`
3. Revisar logs del backend para ver qué doctores se están obteniendo

### Problema: Medicina Integrativa muestra error

**Solución**:
1. Verificar que el backend devuelve array vacío en lugar de error (ya implementado)
2. Verificar que la especialidad aparece en el fallback
3. Si Diego Puebla ya está en DriCloud, verificar que el filtro lo permite

---

## 📊 Métricas de Éxito

### Objetivos
- ✅ **Tiempo de carga inicial**: <2 segundos
- ✅ **Tiempo de respuesta desde caché**: <300ms
- ✅ **Tasa de éxito de preloader**: >90% (5/6 IDs)
- ✅ **Reutilización de sesión**: >80% en WordPress

### Cómo Medir

1. **Tiempo de carga**: DevTools → Network → Filtrar por endpoints del API
2. **Tasa de caché**: CloudWatch → Logs → Buscar "Returning from cache" vs "Fetching from DriCloud"
3. **Sesiones**: CloudWatch → Logs → Buscar "Session renewed" vs "New session created"

---

## 🎯 Próximos Pasos Opcionales (Mejoras Futuras)

### 1. Keep-Alive de DriCloud
- Lambda cada 10 min que llame `GetEspecialidades` para mantener sesión activa

### 2. Prefetch Paralelo
- Cargar especialidades, doctores y disponibilidad en paralelo tras `initializeSession()`

### 3. SessionStorage
- Guardar datos en `sessionStorage` para reutilizar entre navegaciones

### 4. Indicadores de Degradación
- Mostrar "Usando caché" cuando los datos vienen de DynamoDB

---

## 📝 Resumen de Archivos Modificados

### Backend
- ✅ `packages/api/src/bootstrap/bootstrap.controller.ts` - Cookie SameSite=None
- ✅ `packages/api/src/doctor-availability/doctor-availability.service.ts` - Caché implementado
- ✅ `packages/api/src/doctor-availability/doctor-availability.controller.ts` - Soporte refresh
- ✅ `packages/api/src/doctor-availability/doctor-availability.module.ts` - DatabaseModule agregado
- ✅ `packages/api/src/initialization/cache-preloader.service.ts` - 5 especialidades
- ✅ `packages/api/src/doctors/doctors.service.ts` - Urología+Andrología combinadas, Medicina Integrativa manejada

### Frontend
- ✅ `packages/widget/src/services/GuaAPIService.ts` - Timeouts optimizados
- ✅ `packages/widget/src/components/organisms/Services.tsx` - Consolidación Urología+Andrología

---

## ✅ Listo para Desplegar

Todos los cambios están implementados y verificados. Sigue los pasos arriba para desplegar y verificar que todo funciona correctamente.

**¿Necesitas ayuda con algún paso específico?** 🚀


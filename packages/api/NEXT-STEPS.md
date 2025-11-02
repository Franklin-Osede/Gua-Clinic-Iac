# 📋 Próximos Pasos - Checklist de Producción

## ✅ Completado

- [x] Backend desplegado en ECS Fargate
- [x] API Gateway configurado
- [x] Script de actualización automática de IP creado
- [x] Integración con DriCloud configurada (modo mock desactivado)
- [x] Endpoints básicos funcionando (bootstrap, medical-specialties)
- [x] CORS configurado en backend NestJS

## 🎯 Siguiente Paso: Probar el Widget en WordPress

### Paso 1: Verificar la URL del API Gateway en WordPress

El widget debe usar la URL del API Gateway (no la IP directa):

```php
// En gua-clinic-widget.php, línea 57
'api_url' => 'https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod'
```

**URL del API Gateway:** `https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod`

Esta URL **nunca cambia**, solo cambia la IP interna del backend (manejada automáticamente).

### Paso 2: Probar el Widget

1. Ve a tu página de WordPress donde está el shortcode:
   ```
   [gua_clinic_widget]
   ```

2. Abre la consola del navegador (F12) y verifica:
   - ✅ No hay errores 504 Gateway Timeout
   - ✅ No hay errores CORS bloqueando requests
   - ✅ El widget carga correctamente
   - ✅ Se muestran las especialidades médicas

### Paso 3: Si hay errores CORS

Si ves errores CORS en el navegador:

```bash
# Ejecutar script de actualización (configura OPTIONS también)
cd gua-clinic-monorepo/packages/api
./update-api-gateway-ip.sh
```

### Paso 4: Verificar Funcionalidad Completa

Probar el flujo completo:

1. ✅ **Bootstrap** - Carga inicial del widget
2. ✅ **Medical Specialties** - Lista de especialidades
3. ✅ **Doctors** - Lista de doctores por especialidad
4. ✅ **Availability** - Horarios disponibles
5. ✅ **Appointment Types** - Tipos de cita
6. ✅ **Patient** - Búsqueda/creación de paciente
7. ✅ **Appointment** - Creación de cita

## 🔧 Mantenimiento

### Cuando la IP cambie (automático)

El script `deploy-ecs.sh` ahora actualiza automáticamente el API Gateway. Solo necesitas:

```bash
./deploy-ecs.sh
```

### Actualización manual de IP

Si necesitas actualizar manualmente (cuando ECS reinicia sin despliegue):

```bash
./update-api-gateway-ip.sh
```

### Monitoreo

Revisar logs si hay problemas:

```bash
# Ver logs del backend
aws logs tail /ecs/gua-clinic-api --region eu-north-1 --since 1h

# Ver logs con errores
aws logs tail /ecs/gua-clinic-api --region eu-north-1 --since 1h --filter-pattern "ERROR"
```

## 🐛 Troubleshooting

### Error 504 Gateway Timeout
**Causa:** IP del backend cambió y API Gateway apunta a IP antigua
**Solución:** Ejecutar `./update-api-gateway-ip.sh`

### Error CORS
**Causa:** Headers CORS no configurados o OPTIONS no funciona
**Solución:** El backend maneja CORS, pero si persiste, ejecutar `./update-api-gateway-ip.sh` (configura OPTIONS)

### Widget no carga
**Verificar:**
1. URL del API Gateway correcta en WordPress
2. Backend respondiendo: `curl https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod/health`
3. Consola del navegador para errores específicos

### Backend no responde
**Verificar:**
1. Estado del servicio ECS:
   ```bash
   aws ecs describe-services --cluster gua-clinic-api --services gua-clinic-api-service --region eu-north-1
   ```
2. Health check:
   ```bash
   ./get-api-url.sh
   curl http://[IP]:3000/health
   ```

## 📊 Estado Actual

- **API Gateway URL:** `https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod`
- **Backend IP:** Cambia automáticamente (actualmente: consultar con `./get-api-url.sh`)
- **Modo Mock:** Desactivado ✅
- **CORS:** Configurado en backend ✅
- **Scripts Automáticos:** Configurados ✅

## 🚀 Listo para Producción

El sistema está listo para usar en WordPress. El siguiente paso es **probar el widget en tu sitio web real**.


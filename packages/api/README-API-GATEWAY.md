# Configuración del API Gateway sin Load Balancer

## ✅ Solución Implementada

Para evitar el costo adicional de un Application Load Balancer (~$16-18/mes), hemos configurado una solución automática que actualiza el API Gateway cuando cambia la IP del backend.

## 🔄 Actualización Automática

### Automática (durante despliegue)
El script `deploy-ecs.sh` ahora **actualiza automáticamente** el API Gateway al finalizar el despliegue. No necesitas hacer nada manualmente.

### Manual (si la IP cambia sin despliegue)
Si por alguna razón la IP cambia (por ejemplo, ECS reinicia el contenedor), ejecuta:

```bash
./update-api-gateway-ip.sh
```

Este script:
1. Detecta la IP actual del backend ECS
2. Actualiza todas las integraciones del API Gateway
3. Despliega los cambios automáticamente

## 📋 Cuándo ejecutar el script manualmente

Ejecuta `update-api-gateway-ip.sh` si:
- El servicio ECS se reinicia y la IP cambia
- El widget deja de funcionar (error 504 Gateway Timeout)
- Ves errores CORS que antes no ocurrían

## 💰 Costos

- **Sin Load Balancer**: ~$18/mes (ECS Fargate + API Gateway)
- **Con Load Balancer**: ~$34-36/mes (ECS + ALB + API Gateway)

**Ahorro**: ~$16-18/mes sin Load Balancer ✅

## ✅ Verificación

Para verificar que todo funciona:

```bash
# Probar el API Gateway
curl https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod/health

# Probar bootstrap
curl https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod/bootstrap

# Ver IP actual del backend
./get-api-url.sh
```

## 🚀 Proceso de Despliegue

1. **Desplegar**: `./deploy-ecs.sh`
2. **Automático**: El script actualiza el API Gateway
3. **Listo**: El widget debería funcionar inmediatamente

## ⚠️ Notas Importantes

- El API Gateway URL **nunca cambia**: `https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod`
- Solo la IP interna del backend cambia (manejado automáticamente)
- Si necesitas cambiar la IP manualmente, usa: `./update-api-gateway-ip.sh`


# 🔧 Configuración Persistente del Widget

## Problema

Cuando levantas el servidor de desarrollo (`npm run dev`), a veces la configuración se "desconfigura". Esto puede pasar por varias razones:

1. **Variables de entorno no están configuradas** - Se usan valores por defecto que apuntan a `localhost:3000` (que no existe)
2. **API Gateway se desconfigura** - Las rutas específicas pueden causar conflictos
3. **Caché de DynamoDB expira** - Los datos se recargan desde DriCloud (normal, cada 10 minutos)

## Solución: Configuración Persistente

### 1. Variables de Entorno (OBLIGATORIO)

**IMPORTANTE:** La primera vez que clones el repositorio, debes crear el archivo `.env.development`:

```bash
cd packages/widget
cp .env.development.example .env.development
```

El archivo `.env.development` contiene:

```bash
# URL del API Gateway (producción)
VITE_GUA_SERVICE_URL=https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod

# Clave AES para desarrollo
VITE_AES_KEY=dGVzdC1hZXMta2V5LWZvci1kZXZlbG9wbWVudA==
```

**Nota:** Este archivo NO se incluye en git (está en .gitignore), así que cada desarrollador debe crearlo localmente.

**✅ El script `start-dev.sh` ahora crea automáticamente este archivo si no existe**, pero es mejor crearlo manualmente la primera vez.

### 2. Verificar API Gateway

Si las rutas del API Gateway se desconfiguran, ejecuta:

```bash
cd packages/api
./fix-api-gateway-routes.sh
```

Este script:
- ✅ Verifica que existe la ruta catch-all `ANY /{proxy+}`
- ✅ Elimina rutas específicas problemáticas (como `GET /medical-specialties`)
- ✅ Asegura que todo use el proxy catch-all

### 3. Datos de DriCloud

**IMPORTANTE:** Los datos (especialidades, doctores, etc.) NO se configuran manualmente. Vienen automáticamente de DriCloud:

```
DriCloud API v2.3
    ↓
Backend NestJS (cachea en DynamoDB por 10 minutos)
    ↓
Widget React
```

**Si no ves datos:**
1. Verifica que DriCloud esté configurado correctamente en AWS Secrets Manager
2. Verifica que el backend ECS esté corriendo: `./check-ecs-status.sh`
3. Verifica que el API Gateway esté configurado: `./fix-api-gateway-routes.sh`

### 4. Caché de DynamoDB

El caché se renueva automáticamente cada 10 minutos. Si quieres forzar una recarga:

```bash
# Desde el widget, usa ?refresh=true
curl "https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/medical-specialties?refresh=true"
```

## Flujo de Desarrollo

1. **Primera vez (solo una vez):**
   ```bash
   cd packages/widget
   cp .env.development.example .env.development
   # Edita .env.development si necesitas cambiar la URL de la API
   ```

2. **Levantar servidor de desarrollo:**
   ```bash
   cd packages/widget
   ./start-dev.sh
   # O simplemente: npm run dev
   ```

   El script `start-dev.sh` ahora:
   - ✅ Verifica que existe `.env.development`
   - ✅ Lo crea automáticamente desde `.env.development.example` si no existe
   - ✅ Muestra la URL de la API configurada
   - ✅ Te avisa si falta alguna variable

3. **Si algo no funciona:**
   - Verifica variables de entorno (`.env.development` existe y tiene `VITE_GUA_SERVICE_URL`)
   - Verifica API Gateway: `cd ../api && ./fix-api-gateway-routes.sh`
   - Verifica backend ECS: `cd ../api && ./check-ecs-status.sh`

4. **Hacer cambios:**
   - Edita componentes en `src/components/`
   - Los cambios se reflejan automáticamente (HMR)
   - Cuando estés listo, haz build: `npm run build`

## Configuración que NO se pierde

✅ **Variables de entorno** - Ahora persisten en `.env.development` (una vez creado)
✅ **Especialidades y doctores** - Vienen de DriCloud automáticamente
✅ **Caché de DynamoDB** - Se renueva automáticamente cada 10 minutos
✅ **Configuración de AWS** - Persiste en AWS (API Gateway, ECS, DynamoDB)

## Configuración que SÍ puede perderse (pero ya está solucionado)

✅ **Variables de entorno locales** - **SOLUCIONADO:** Crea `.env.development` una vez y persiste para siempre
⚠️ **Rutas específicas del API Gateway** - Usa `fix-api-gateway-routes.sh` para corregir (esto es raro)

## Resumen

- **Datos:** Vienen de DriCloud → No se configuran manualmente
- **API Gateway:** Usa proxy catch-all → Ejecuta `fix-api-gateway-routes.sh` si hay problemas
- **Variables de entorno:** Crea `.env.development` para desarrollo local


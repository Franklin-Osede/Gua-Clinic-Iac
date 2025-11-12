# 🚀 Guía Completa de Configuración del Widget GUA Clinic

## Problema Resuelto

Esta guía soluciona los siguientes problemas que ocurrían al cerrar y reabrir el proyecto:

1. ❌ **Estilos desalineados** - El widget se veía mal al reiniciar
2. ❌ **No se pueden obtener datos** - Las llamadas a DriCloud fallaban
3. ❌ **Mixed Content en WordPress** - Errores de seguridad al usar HTTP desde HTTPS
4. ❌ **Configuración se pierde** - Tenías que reconfigurar todo cada vez

## ✅ Solución Implementada

### 1. Configuración Persistente con `.env.development`

**Primera vez (solo una vez):**

```bash
cd packages/widget
cp .env.dev .env.development
```

El archivo `.env.development` contiene:
```bash
VITE_GUA_SERVICE_URL=https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod
VITE_AES_KEY=dGVzdC1hZXMta2V5LWZvci1kZXZlbG9wbWVudA==
```

**⚠️ IMPORTANTE:** 
- Este archivo NO se sube a git (está en `.gitignore`)
- Cada desarrollador debe crearlo una sola vez
- El script `start-dev.sh` lo crea automáticamente si no existe

### 2. Siempre HTTPS (No más Mixed Content)

**Antes (❌):**
- Usaba `http://13.53.43.4:3000` (IP directa, sin HTTPS)
- Causaba "Mixed Content" en WordPress
- No pasaba por el load balancer

**Ahora (✅):**
- Usa `https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod` (API Gateway con HTTPS)
- Funciona perfectamente en WordPress
- Pasa por el load balancer con rate limiting y logs

### 3. Bloque Gutenberg Reutilizable

**Antes (❌):**
- Tenías que memorizar el shortcode `[gua_clinic_widget]`
- Fácil de escribir mal o usar la URL incorrecta

**Ahora (✅):**
- Busca "GUA Clinic Widget" en el selector de bloques de Gutenberg
- Arrastra y suelta el bloque
- No necesitas recordar nada

## 📋 Pasos para Configurar (Primera Vez)

### Paso 1: Configurar Variables de Entorno

```bash
cd packages/widget
cp .env.dev .env.development
```

**Verifica que el archivo tenga:**
```bash
VITE_GUA_SERVICE_URL=https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod
VITE_AES_KEY=dGVzdC1hZXMta2V5LWZvci1kZXZlbG9wbWVudA==
```

### Paso 2: Iniciar Servidor de Desarrollo

```bash
cd packages/widget
./start-dev.sh
# O simplemente: npm run dev
```

El script `start-dev.sh`:
- ✅ Verifica que existe `.env.development`
- ✅ Lo crea automáticamente si no existe
- ✅ Muestra la URL de la API configurada
- ✅ Te avisa si falta alguna variable

### Paso 3: Verificar que Funciona

1. Abre `http://localhost:5173` en el navegador
2. Abre la consola del navegador (F12)
3. Debe aparecer: `🔧 API Base URL configurada: https://...`
4. El widget debe cargar datos correctamente

## 🔧 Uso en WordPress

### Opción 1: Bloque Gutenberg (Recomendado)

1. Edita cualquier página en WordPress
2. Haz clic en el botón "+" para agregar un bloque
3. Busca "GUA Clinic Widget"
4. Arrastra el bloque a la página
5. Guarda y publica

**Ventajas:**
- ✅ No necesitas memorizar el shortcode
- ✅ Aparece en el selector visual
- ✅ Fácil de reutilizar

### Opción 2: Shortcode Manual

Si prefieres usar el shortcode directamente:

```
[gua_clinic_widget]
```

O con opciones:

```
[gua_clinic_widget locale="es" theme="light" api_url="https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod"]
```

**⚠️ IMPORTANTE:** 
- Si no especificas `api_url`, usa el valor por defecto HTTPS
- **NUNCA** uses `http://13.53.43.4:3000` porque causa "Mixed Content"

## 🏗️ Build y Despliegue

### Build para WordPress

```bash
cd packages/widget
npm run build
```

Esto genera:
- `dist/gua-widget.iife.js` - JavaScript del widget
- `dist/style.css` - Estilos de Tailwind

### Crear ZIP del Plugin

```bash
cd wordpress-plugin
./create-zip.sh
```

Esto crea `gua-clinic-widget.zip` que puedes subir a WordPress.

### Subir a WordPress

1. Ve a WordPress Admin → Plugins → Añadir nuevo
2. Sube `gua-clinic-widget.zip`
3. Activa el plugin
4. Usa el bloque o shortcode en cualquier página

## 🔍 Verificación Post-Despliegue

Después de subir el plugin a WordPress:

1. Abre la página donde está el widget
2. Abre la consola del navegador (F12)
3. Verifica que NO aparezca "Mixed Content"
4. Verifica que aparezca: `🔧 API Base URL configurada: https://...`
5. Verifica que las llamadas a `/bootstrap` y `/medical-specialties` funcionen
6. Verifica que el widget se vea correctamente con estilos

## 🐛 Solución de Problemas

### Problema: "Mixed Content" en WordPress

**Síntoma:**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://...'
```

**Solución:**
1. Verifica que el shortcode/bloque use `api_url` con HTTPS
2. Limpia la caché de WordPress y del navegador
3. Reconstruye el plugin: `npm run build` y `./create-zip.sh`
4. Vuelve a subir el plugin

### Problema: No se cargan datos

**Síntoma:**
- El widget aparece pero muestra "No hay especialidades disponibles"

**Solución:**
1. Abre la consola y verifica que la URL sea HTTPS
2. Verifica que el backend ECS esté corriendo: `cd ../api && ./check-ecs-status.sh`
3. Verifica que el API Gateway esté configurado: `cd ../api && ./fix-api-gateway-routes.sh`
4. Verifica que DriCloud esté configurado en AWS Secrets Manager

### Problema: Estilos desalineados

**Síntoma:**
- El widget se ve mal, elementos desalineados

**Solución:**
1. Verifica que `style.css` esté incluido en el plugin
2. Reconstruye: `npm run build` y `./create-zip.sh`
3. Limpia caché de WordPress y navegador
4. Verifica que no haya conflictos con otros plugins de WordPress

### Problema: Configuración se pierde al reiniciar

**Síntoma:**
- Cada vez que reinicias, tienes que reconfigurar todo

**Solución:**
1. Verifica que existe `.env.development` en `packages/widget/`
2. Verifica que contiene `VITE_GUA_SERVICE_URL` con la URL HTTPS
3. Si no existe, ejecuta: `cp .env.dev .env.development`

## 📝 Resumen de Archivos Importantes

```
packages/widget/
├── .env.dev                    # Plantilla de configuración (se sube a git)
├── .env.development            # Tu configuración local (NO se sube a git)
├── start-dev.sh                # Script que verifica y crea .env.development
├── vite.config.ts              # Configuración de Vite (fallback HTTPS)
└── src/config/api.config.ts    # Lógica de URL (fallback HTTPS)

wordpress-plugin/
├── gua-clinic-widget.php       # Plugin principal (bloque Gutenberg + shortcode)
├── gua-widget.iife.js          # Widget compilado (se genera con npm run build)
└── style.css                   # Estilos compilados (se genera con npm run build)
```

## ✅ Checklist de Configuración

- [ ] Creé `.env.development` desde `.env.dev`
- [ ] Verifiqué que `VITE_GUA_SERVICE_URL` apunta a HTTPS
- [ ] Ejecuté `npm run dev` y vi la URL correcta en consola
- [ ] El widget carga datos correctamente en localhost
- [ ] Hice `npm run build` para generar los archivos
- [ ] Creé el ZIP del plugin con `./create-zip.sh`
- [ ] Subí el plugin a WordPress
- [ ] Verifiqué que no hay "Mixed Content" en la consola
- [ ] El widget funciona correctamente en WordPress

## 🎯 Resultado Final

Con esta configuración:

✅ **Configuración persiste** - No necesitas reconfigurar cada vez
✅ **Siempre HTTPS** - No más errores de "Mixed Content"
✅ **Fácil de usar** - Bloque Gutenberg reutilizable
✅ **Funciona en local y producción** - Misma configuración para ambos

**¡El widget siempre funcionará correctamente!** 🎉


# 📦 Guía: Construir y Subir Widget a WordPress

## 🎯 Objetivo

Construir el widget, empaquetarlo como plugin de WordPress y subirlo para probarlo.

## 📋 Pasos Completos

### Paso 1: Verificar Configuración Local

Asegúrate de tener el archivo `.env.development` configurado:

```bash
cd packages/widget
ls -la .env.development
```

Si no existe, créalo:

```bash
cp .env.dev .env.development
```

### Paso 2: Construir el Widget

Compila el código TypeScript y genera los archivos JavaScript y CSS:

```bash
cd packages/widget
npm run build
```

**Esto genera:**
- `dist/gua-widget.iife.js` - JavaScript del widget
- `dist/style.css` - Estilos de Tailwind compilados

### Paso 3: Copiar Archivos al Plugin

Copia los archivos generados al directorio del plugin:

```bash
# Desde packages/widget
cp dist/gua-widget.iife.js ../wordpress-plugin/
cp dist/style.css ../wordpress-plugin/
```

**O usa el script automatizado que hace todo:**

```bash
cd gua-clinic-monorepo
./scripts/build-and-deploy-widget.sh
```

Este script:
- ✅ Construye el widget
- ✅ Copia los archivos al plugin
- ✅ Crea el ZIP automáticamente

### Paso 4: Crear el ZIP del Plugin

Desde el directorio del plugin:

```bash
cd wordpress-plugin
./make-zip.sh
```

**O manualmente:**

```bash
cd wordpress-plugin
zip -r ~/Desktop/gua-clinic-widget.zip \
    gua-clinic-widget.php \
    gua-widget.iife.js \
    style.css \
    readme.txt
```

El ZIP se creará en tu escritorio: `~/Desktop/gua-clinic-widget-FINAL-v1.0.2.zip`

### Paso 5: Subir a WordPress

1. **Accede al panel de WordPress:**
   - Ve a `Plugins → Añadir nuevo`
   - O sube por FTP a `/wp-content/plugins/`

2. **Sube el ZIP:**
   - Haz clic en "Subir plugin"
   - Selecciona el archivo `gua-clinic-widget-FINAL-v1.0.2.zip`
   - Haz clic en "Instalar ahora"

3. **Activa el plugin:**
   - Después de instalar, haz clic en "Activar plugin"

### Paso 6: Usar el Widget en WordPress

#### Opción A: Bloque Gutenberg (Recomendado)

1. Edita cualquier página o entrada
2. Haz clic en el botón "+" para agregar un bloque
3. Busca "GUA Clinic Widget"
4. Arrastra el bloque a la página
5. Guarda y publica

#### Opción B: Shortcode Manual

1. Edita cualquier página o entrada
2. Inserta el shortcode:

```
[gua_clinic_widget]
```

O con opciones:

```
[gua_clinic_widget locale="es" theme="light"]
```

### Paso 7: Verificar que Funciona

1. **Abre la página en el navegador**
2. **Abre la consola del navegador (F12)**
3. **Verifica que NO aparezca "Mixed Content"**
4. **Verifica que aparezca:**
   ```
   🔧 API Base URL configurada: https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod
   ```
5. **Verifica que el widget se vea correctamente:**
   - Estilos aplicados
   - Datos cargando (especialidades, doctores)
   - Sin errores en consola

## 🚀 Script Todo-en-Uno (Recomendado)

Para hacer todo de una vez, usa el script automatizado:

```bash
cd gua-clinic-monorepo
./scripts/build-and-deploy-widget.sh
```

Este script:
1. ✅ Verifica configuración
2. ✅ Construye el widget
3. ✅ Copia archivos al plugin
4. ✅ Crea el ZIP
5. ✅ Te muestra dónde está el ZIP

## 🔍 Verificación Post-Instalación

Después de subir el plugin a WordPress, verifica:

### En la Consola del Navegador (F12):

✅ **Debe aparecer:**
```
🔧 API Base URL configurada: https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod
🌐 Llamando a: https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod/bootstrap
```

❌ **NO debe aparecer:**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://...'
```

### En la Página:

✅ **Debe verse:**
- Widget con estilos aplicados
- Especialidades médicas cargando
- Doctores disponibles
- Calendario funcional

❌ **NO debe verse:**
- "No hay especialidades disponibles"
- Estilos desalineados
- Errores en la interfaz

## 🐛 Solución de Problemas

### Problema: "Mixed Content" en consola

**Solución:**
1. Verifica que el plugin tenga la versión más reciente
2. Limpia la caché de WordPress
3. Limpia la caché del navegador
4. Vuelve a construir y subir el plugin

### Problema: No se cargan datos

**Solución:**
1. Verifica en consola que la URL sea HTTPS (no HTTP)
2. Verifica que el backend ECS esté corriendo
3. Verifica que el API Gateway esté configurado

### Problema: Estilos no se aplican

**Solución:**
1. Verifica que `style.css` esté en el ZIP
2. Limpia caché de WordPress y navegador
3. Verifica que no haya conflictos con otros plugins

## 📝 Resumen Rápido

```bash
# 1. Construir
cd packages/widget
npm run build

# 2. Copiar al plugin
cp dist/gua-widget.iife.js ../wordpress-plugin/
cp dist/style.css ../wordpress-plugin/

# 3. Crear ZIP
cd ../wordpress-plugin
./make-zip.sh

# 4. Subir a WordPress
# El ZIP está en ~/Desktop/gua-clinic-widget-FINAL-v1.0.2.zip
```

**O usa el script todo-en-uno:**

```bash
cd gua-clinic-monorepo
./scripts/build-and-deploy-widget.sh
```

## ✅ Checklist Final

Antes de subir a producción, verifica:

- [ ] Widget construido sin errores (`npm run build`)
- [ ] Archivos copiados al plugin (`gua-widget.iife.js` y `style.css`)
- [ ] ZIP creado correctamente
- [ ] Plugin activado en WordPress
- [ ] No hay "Mixed Content" en consola
- [ ] URL de API es HTTPS
- [ ] Widget carga datos correctamente
- [ ] Estilos se aplican correctamente
- [ ] Bloque Gutenberg aparece en el selector

---

**¡Listo para probar!** 🎉


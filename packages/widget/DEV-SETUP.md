# 🚀 Guía de Desarrollo Local del Widget

## Inicio Rápido

### 1. Instalar dependencias (si no lo has hecho)
```bash
cd packages/widget
npm install
```

### 2. Levantar el servidor de desarrollo
```bash
npm run dev
```

El servidor se levantará en: **http://localhost:5173**

### 3. Abrir en el navegador
- Abre: http://localhost:5173
- El widget se recargará automáticamente cuando hagas cambios (Hot Module Replacement)

## Configuración

### Cambiar la URL de la API

Edita el archivo `.env.development`:
```bash
# Para usar la API de producción (por defecto)
VITE_GUA_SERVICE_URL=https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod

# Para usar el backend local (si lo tienes corriendo)
VITE_GUA_SERVICE_URL=http://localhost:3000
```

### Variables de Entorno Disponibles

- `VITE_GUA_SERVICE_URL`: URL base de la API
- `VITE_AES_KEY`: Clave AES para encriptación (solo desarrollo)

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── atoms/          # Componentes pequeños (botones, íconos)
│   ├── molecules/      # Componentes medianos (tarjetas)
│   └── organisms/      # Componentes grandes (formularios, listas)
├── pages/              # Páginas principales
├── services/           # Servicios (API, encriptación)
└── config/             # Configuración

```

## Comandos Disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
npm run lint:fix

# Formateo
npm run format
```

## Hot Module Replacement (HMR)

- Los cambios en archivos `.tsx`, `.ts`, `.css` se reflejan **automáticamente** sin recargar la página
- Los cambios en `index.html` requieren recarga manual
- Si algo no se actualiza, recarga la página (F5)

## Debugging

### DevTools del Navegador
- Abre las DevTools (F12)
- Ve a la pestaña "Console" para ver logs
- Ve a "Network" para ver peticiones a la API

### Logs en la Consola
El widget muestra logs útiles:
- `🔧 API Base URL configurada: ...` - Confirma la URL de la API
- Errores de red o API aparecerán en la consola

## Solución de Problemas

### El servidor no inicia
```bash
# Verifica que el puerto 5173 no esté en uso
lsof -i :5173

# Si está en uso, mata el proceso o cambia el puerto en vite.config.ts
```

### Los cambios no se reflejan
1. Guarda el archivo (Ctrl+S / Cmd+S)
2. Verifica que no haya errores en la consola
3. Recarga la página si es necesario

### Errores de CORS
- El servidor de desarrollo ya tiene CORS habilitado
- Si persisten, verifica que la API permita el origen `http://localhost:5173`

## Próximos Pasos

1. **Edita componentes** en `src/components/`
2. **Ve los cambios en tiempo real** en http://localhost:5173
3. **Cuando estés listo**, ejecuta `npm run build` para generar el bundle de producción





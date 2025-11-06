#!/bin/bash
# Script para probar el widget localmente antes de subir a WordPress
# Simula cómo funcionará en WordPress

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Test del Widget - Flujo Completo"
echo "===================================="
echo ""

# 1. Verificar que el build existe
if [ ! -f "dist/gua-widget.iife.js" ]; then
    echo "❌ Error: No se encontró dist/gua-widget.iife.js"
    echo "   Ejecuta primero: npm run build"
    exit 1
fi

echo "✅ Widget compilado encontrado"
echo ""

# 2. Crear archivo HTML de prueba
cat > test-widget-local.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Widget GUA Clinic</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .test-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .test-info h3 {
            margin-top: 0;
        }
        .test-info code {
            background: #fff;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.9em;
        }
        gua-widget {
            display: block;
            width: 100%;
            min-height: 500px;
            border: 2px solid #ddd;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>🧪 Test Widget GUA Clinic</h1>
        
        <div class="test-info">
            <h3>📋 Configuración:</h3>
            <p><strong>API URL:</strong> <code id="api-url">http://localhost:3000</code></p>
            <p><strong>Locale:</strong> <code>es</code></p>
            <p><strong>Theme:</strong> <code>light</code></p>
            <p><strong>Widget Status:</strong> <span id="widget-status">⏳ Cargando...</span></p>
        </div>

        <h2>Widget:</h2>
        <gua-widget 
            locale="es" 
            theme="light" 
            base-url="http://localhost:3000">
        </gua-widget>
    </div>

    <!-- Cargar React desde CDN (requerido para el widget) -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    
    <!-- Cargar el widget -->
    <script src="dist/gua-widget.iife.js"></script>

    <script>
        // Escuchar eventos del widget
        const widget = document.querySelector('gua-widget');
        const statusEl = document.getElementById('widget-status');
        
        widget.addEventListener('ready', function(event) {
            console.log('✅ Widget ready:', event.detail);
            statusEl.textContent = '✅ Ready';
            statusEl.style.color = 'green';
        });
        
        widget.addEventListener('success', function(event) {
            console.log('✅ Widget success:', event.detail);
            statusEl.textContent = '✅ Success';
            statusEl.style.color = 'green';
        });
        
        widget.addEventListener('error', function(event) {
            console.error('❌ Widget error:', event.detail);
            statusEl.textContent = '❌ Error';
            statusEl.style.color = 'red';
        });

        // Mostrar errores en consola
        window.addEventListener('error', function(e) {
            console.error('Error global:', e);
        });
    </script>
</body>
</html>
EOF

echo "✅ Archivo HTML de prueba creado: test-widget-local.html"
echo ""

# 3. Iniciar servidor HTTP simple (si no está corriendo)
echo "📡 Para probar el widget:"
echo ""
echo "   Opción 1: Usar Python (si tienes Python instalado)"
echo "   ${GREEN}cd packages/widget && python3 -m http.server 8080${NC}"
echo "   Luego abre: http://localhost:8080/test-widget-local.html"
echo ""
echo "   Opción 2: Usar Node.js http-server"
echo "   ${GREEN}npm install -g http-server && cd packages/widget && http-server -p 8080${NC}"
echo "   Luego abre: http://localhost:8080/test-widget-local.html"
echo ""
echo "   Opción 3: Usar el servidor de Vite"
echo "   ${GREEN}cd packages/widget && npm run dev${NC}"
echo ""

# 4. Verificar que el backend esté corriendo
echo "⚠️  IMPORTANTE: Asegúrate de que el backend esté corriendo:"
echo "   ${GREEN}cd packages/api && npm run start:dev${NC}"
echo "   Debe estar en: http://localhost:3000"
echo ""

# 5. Checklist de verificación
echo "📋 Checklist de verificación:"
echo "   [ ] Backend corriendo en http://localhost:3000"
echo "   [ ] Widget compilado en dist/gua-widget.iife.js"
echo "   [ ] Servidor HTTP corriendo (Python/Node/Vite)"
echo "   [ ] Abrir test-widget-local.html en el navegador"
echo "   [ ] Verificar que el widget carga y muestra '✅ Ready'"
echo "   [ ] Probar crear una cita completa"
echo ""

echo "🔍 Para ver logs en la consola del navegador:"
echo "   Presiona F12 → Console"
echo ""








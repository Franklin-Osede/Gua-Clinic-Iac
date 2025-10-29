#!/bin/bash
# Script para verificar el estado de los servicios y probar el widget

echo "🧪 Verificación del Estado del Widget"
echo "======================================"
echo ""

# Verificar backend
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Backend corriendo en puerto 3000"
    
    # Probar endpoint bootstrap
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/bootstrap)
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Endpoint /bootstrap responde correctamente"
    else
        echo "⚠️  Endpoint /bootstrap responde con código: $RESPONSE"
    fi
else
    echo "❌ Backend NO está corriendo"
    echo "   Inicia con: cd packages/api && npm run start:dev"
fi

echo ""

# Verificar servidor widget
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "✅ Servidor widget corriendo en puerto 8080"
    echo "   URL: http://localhost:8080/test-widget-local.html"
else
    echo "❌ Servidor widget NO está corriendo"
    echo "   Inicia con: cd packages/widget && python3 -m http.server 8080"
fi

echo ""

# Verificar archivos
if [ -f "packages/widget/dist/gua-widget.iife.js" ]; then
    SIZE=$(du -h packages/widget/dist/gua-widget.iife.js | cut -f1)
    echo "✅ Widget compilado encontrado ($SIZE)"
else
    echo "❌ Widget NO compilado"
    echo "   Compila con: cd packages/widget && npm run build"
fi

if [ -f "packages/widget/test-widget-local.html" ]; then
    echo "✅ HTML de prueba encontrado"
else
    echo "⚠️  HTML de prueba no encontrado"
fi

echo ""
echo "📋 Checklist de Prueba:"
echo "   [ ] Abre http://localhost:8080/test-widget-local.html"
echo "   [ ] Verifica que el widget carga (debe mostrar '✅ Ready')"
echo "   [ ] Prueba el flujo completo de creación de cita"
echo "   [ ] Verifica que no hay errores en la consola (F12)"
echo ""


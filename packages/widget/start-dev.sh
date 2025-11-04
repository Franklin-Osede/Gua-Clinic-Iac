#!/bin/bash

echo "🚀 Iniciando servidor de desarrollo del Widget GUA..."
echo ""
echo "📋 Configuración:"
echo "  • Puerto: 5173"
echo "  • URL: http://localhost:5173"
echo "  • Hot Reload: ✅ Activado"
echo ""
echo "💡 Para cambiar la URL de la API, edita .env.development"
echo "   o usa: VITE_GUA_SERVICE_URL=http://localhost:3000 npm run dev"
echo ""
echo "⏳ Iniciando servidor..."
echo ""

npm run dev


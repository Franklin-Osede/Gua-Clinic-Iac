#!/bin/bash

# Script para probar creación de cita en modo mock (NO crea citas reales)

echo "🧪 Probando creación de cita en modo MOCK..."
echo ""

# Verificar que el servidor esté corriendo
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "❌ El servidor no está corriendo en http://localhost:3000"
  echo "   Ejecuta: npm run start:dev"
  exit 1
fi

echo "✅ Servidor detectado"
echo ""

# Probar crear cita
echo "📝 Creando cita de prueba (modo mock)..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/appointment \
  -H "Content-Type: application/json" \
  -d '{
    "PAC_ID": 123,
    "USU_ID": 456,
    "TCI_ID": 789,
    "FECHA": "2024-01-15",
    "HORA": "10:30",
    "OBSERVACIONES": "Prueba - Mock Mode"
  }')

echo "📋 Respuesta:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Verificar si está en modo mock
if echo "$RESPONSE" | grep -q "Mock Mode"; then
  echo "✅ Modo Mock activado - No se creó cita real en DriCloud"
else
  echo "⚠️  Advertencia: No se detectó mensaje de Mock Mode"
  echo "   Verifica que DRICLOUD_MOCK_MODE=true esté configurado"
fi


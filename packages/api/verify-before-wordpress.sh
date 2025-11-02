#!/bin/bash

# Script de verificación completa antes de integrar con WordPress
# Ejecuta todas las pruebas necesarias para asegurar que todo funciona

set -e

echo "🔍 VERIFICACIÓN COMPLETA ANTES DE INTEGRAR CON WORDPRESS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Obtener URL de la API
TASK_ARN=$(aws ecs list-tasks --cluster gua-clinic-api --region eu-north-1 --query 'taskArns[0]' --output text 2>/dev/null || echo "")
if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo "❌ No se encontró el servicio ECS activo"
  echo "   Ejecuta: ./get-api-url.sh para obtener la URL"
  exit 1
fi

ENI_ID=$(aws ecs describe-tasks --cluster gua-clinic-api --tasks "$TASK_ARN" --region eu-north-1 --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text 2>/dev/null || echo "")
PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids "$ENI_ID" --region eu-north-1 --query 'NetworkInterfaces[0].Association.PublicIp' --output text 2>/dev/null || echo "")

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; then
  echo "❌ No se pudo obtener la IP pública"
  exit 1
fi

API_URL="http://$PUBLIC_IP:3000"
echo "📍 API URL: $API_URL"
echo ""

# Crear archivo de cookies temporal
COOKIE_FILE="/tmp/gua-api-cookies.txt"
rm -f "$COOKIE_FILE"

# Función para hacer requests con manejo de errores
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo "🧪 $name..."
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" "$API_URL$endpoint" 2>&1)
  else
    response=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_FILE" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_URL$endpoint" 2>&1)
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
    echo "   ✅ OK (HTTP $http_code)"
    echo "$body" | jq . 2>/dev/null | head -5 || echo "$body" | head -3
    return 0
  else
    echo "   ❌ ERROR (HTTP $http_code)"
    echo "$body" | head -3
    return 1
  fi
}

# Contador de errores
ERRORS=0

echo "═══════════════════════════════════════════════════════════"
echo "1️⃣ VERIFICACIONES BÁSICAS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Health Check
if ! test_endpoint "Health Check" "GET" "/health" ""; then
  ((ERRORS++))
fi

# Bootstrap (crear sesión)
echo ""
echo "🧪 Bootstrap (crear sesión)..."
bootstrap_response=$(curl -s -c "$COOKIE_FILE" "$API_URL/bootstrap")
if echo "$bootstrap_response" | jq -e '.session.id' > /dev/null 2>&1; then
  echo "   ✅ Sesión creada correctamente"
  session_id=$(echo "$bootstrap_response" | jq -r '.session.id')
  echo "   📋 Session ID: ${session_id:0:20}..."
else
  echo "   ❌ Error al crear sesión"
  echo "$bootstrap_response"
  ((ERRORS++))
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "2️⃣ ENDPOINTS CRÍTICOS DEL FLUJO"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Medical Specialties
if ! test_endpoint "Medical Specialties" "GET" "/medical-specialties" ""; then
  ((ERRORS++))
fi

# Doctors (necesita ESP_ID)
echo ""
echo "🧪 Doctors (ESP_ID=1)..."
doctors_response=$(curl -s -b "$COOKIE_FILE" "$API_URL/doctors/1")
if echo "$doctors_response" | jq -e 'length > 0' > /dev/null 2>&1; then
  echo "   ✅ Doctores encontrados"
  doctor_count=$(echo "$doctors_response" | jq 'length')
  echo "   📊 Total: $doctor_count doctores"
else
  echo "   ⚠️  No se encontraron doctores o respuesta inesperada"
  echo "$doctors_response" | jq . 2>/dev/null || echo "$doctors_response"
fi

# Appointment Types
echo ""
if ! test_endpoint "Appointment Types (ESP_ID=1)" "GET" "/appointments-types/1" ""; then
  ((ERRORS++))
fi

# Doctor Availability (con formato correcto)
echo ""
echo "🧪 Doctor Availability (formato yyyyMMdd)..."
availability_response=$(curl -s -b "$COOKIE_FILE" "$API_URL/doctor-availability/1/20251102")
if echo "$availability_response" | jq -e '.Successful == true' > /dev/null 2>&1; then
  echo "   ✅ Disponibilidad obtenida"
  echo "$availability_response" | jq '.Data | length' 2>/dev/null || echo "$availability_response" | head -2
else
  echo "   ⚠️  Respuesta:"
  echo "$availability_response" | jq . 2>/dev/null | head -5 || echo "$availability_response" | head -3
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "3️⃣ VERIFICACIONES DE SEGURIDAD Y CORS"
echo "═══════════════════════════════════════════════════════════"
echo ""

# CORS Preflight
echo "🧪 CORS Preflight (OPTIONS)..."
cors_response=$(curl -s -X OPTIONS -H "Origin: https://www.guaclinic.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "\n%{http_code}" \
  "$API_URL/bootstrap" 2>&1)
http_code=$(echo "$cors_response" | tail -n1)

if [ "$http_code" == "204" ] || [ "$http_code" == "200" ]; then
  echo "   ✅ CORS Preflight OK"
else
  echo "   ⚠️  CORS Preflight: HTTP $http_code"
  ((ERRORS++))
fi

# Verificar headers de seguridad
echo ""
echo "🧪 Security Headers..."
headers=$(curl -s -I "$API_URL/health" | grep -i "x-content-type-options\|x-frame-options\|x-xss-protection")
if [ ! -z "$headers" ]; then
  echo "   ✅ Headers de seguridad presentes"
  echo "$headers" | sed 's/^/      /'
else
  echo "   ⚠️  No se detectaron headers de seguridad"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "4️⃣ VERIFICACIONES DE CONFIGURACIÓN"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Verificar que DRICLOUD_MOCK_MODE esté desactivado
echo "🧪 Verificando modo Mock..."
# No podemos verificar directamente desde fuera, pero podemos intentar crear una cita
echo "   ℹ️  Verifica en ECS Task Definition que DRICLOUD_MOCK_MODE=false"
echo "   ℹ️  O ejecuta: aws ecs describe-task-definition --task-definition gua-clinic-api --region eu-north-1"

echo ""
echo "🧪 Verificando conexión con DriCloud..."
system_status=$(curl -s "$API_URL/system-status" | jq -r '.health.services[] | select(.service=="dricloud-api") | .status' 2>/dev/null || echo "unknown")
if [ "$system_status" == "healthy" ] || [ "$system_status" == "degraded" ]; then
  echo "   ✅ DriCloud API: $system_status"
else
  echo "   ⚠️  DriCloud API: $system_status"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "5️⃣ VERIFICACIONES DE PERFORMANCE"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "🧪 Tiempo de respuesta (bootstrap)..."
time_response=$(curl -s -w "\n%{time_total}" -o /dev/null "$API_URL/bootstrap" 2>&1)
time_total=$(echo "$time_response" | tail -n1)
if (( $(echo "$time_total < 2.0" | bc -l) )); then
  echo "   ✅ Tiempo de respuesta: ${time_total}s (bueno)"
else
  echo "   ⚠️  Tiempo de respuesta: ${time_total}s (podría mejorar)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📋 RESUMEN"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✅ TODAS LAS VERIFICACIONES PASARON"
  echo ""
  echo "🌐 URL para WordPress:"
  echo "   $API_URL"
  echo ""
  echo "📝 Para integrar en WordPress:"
  echo "   [gua_clinic_widget api_url=\"$API_URL\"]"
  echo ""
else
  echo "⚠️  SE ENCONTRARON $ERRORS ERROR(ES)"
  echo "   Revisa los errores arriba antes de integrar con WordPress"
  echo ""
fi

# Limpiar
rm -f "$COOKIE_FILE"

echo ""
echo "💡 PRÓXIMOS PASOS:"
echo "   1. Verificar dominio de WordPress en CORS (main.ts)"
echo "   2. Asegurar que DRICLOUD_MOCK_MODE=false en producción"
echo "   3. Considerar usar Load Balancer + dominio para URL estable"
echo "   4. Probar flujo completo de creación de cita"
echo ""


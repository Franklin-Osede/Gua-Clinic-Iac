#!/bin/bash

# Script para verificar y corregir rutas del API Gateway HTTP API v2
# Ejecuta este script si las rutas se desconfiguran

set -e

REGION="eu-north-1"
API_ID="ybymfv93yg"
STAGE_NAME="prod"
ALB_URL="http://gua-clinic-api-alb-766718797.eu-north-1.elb.amazonaws.com"

echo "🔧 Verificando y corrigiendo rutas del API Gateway..."
echo ""

# Verificar que existe la ruta catch-all
echo "1️⃣ Verificando ruta catch-all (ANY /{proxy+})..."
CATCH_ALL_ROUTE=$(aws apigatewayv2 get-routes \
  --api-id "$API_ID" \
  --region "$REGION" \
  --query 'Items[?RouteKey==`ANY /{proxy+}`]' \
  --output json)

if [ "$CATCH_ALL_ROUTE" == "[]" ]; then
  echo "   ⚠️  No existe ruta catch-all, creándola..."
  
  # Obtener o crear integración para proxy
  INTEGRATION_ID=$(aws apigatewayv2 get-integrations \
    --api-id "$API_ID" \
    --region "$REGION" \
    --query 'Items[?IntegrationUri==`'"${ALB_URL}"'/{proxy}`].IntegrationId' \
    --output text)
  
  if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" == "None" ]; then
    echo "   📝 Creando integración para proxy..."
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
      --api-id "$API_ID" \
      --integration-type HTTP_PROXY \
      --integration-method ANY \
      --integration-uri "${ALB_URL}/{proxy}" \
      --payload-format-version "1.0" \
      --region "$REGION" \
      --query 'IntegrationId' \
      --output text)
    echo "   ✅ Integración creada: $INTEGRATION_ID"
  else
    echo "   ✅ Integración existente: $INTEGRATION_ID"
  fi
  
  # Crear ruta catch-all
  ROUTE_ID=$(aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "ANY /{proxy+}" \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" \
    --query 'RouteId' \
    --output text)
  
  echo "   ✅ Ruta catch-all creada: $ROUTE_ID"
else
  echo "   ✅ Ruta catch-all existe"
fi

echo ""

# Verificar rutas específicas problemáticas
echo "2️⃣ Verificando rutas específicas..."
SPECIFIC_ROUTES=$(aws apigatewayv2 get-routes \
  --api-id "$API_ID" \
  --region "$REGION" \
  --query 'Items[?RouteKey==`GET /medical-specialties`]' \
  --output json)

if [ "$SPECIFIC_ROUTES" != "[]" ]; then
  echo "   ⚠️  Encontrada ruta específica GET /medical-specialties"
  echo "   🗑️  Eliminando (debe usar proxy catch-all)..."
  
  ROUTE_ID=$(aws apigatewayv2 get-routes \
    --api-id "$API_ID" \
    --region "$REGION" \
    --query 'Items[?RouteKey==`GET /medical-specialties`].RouteId' \
    --output text)
  
  aws apigatewayv2 delete-route \
    --api-id "$API_ID" \
    --route-id "$ROUTE_ID" \
    --region "$REGION" > /dev/null
  
  echo "   ✅ Ruta específica eliminada"
else
  echo "   ✅ No hay rutas específicas problemáticas"
fi

echo ""
echo "✅ Verificación completada"
echo ""
echo "📋 Rutas actuales:"
aws apigatewayv2 get-routes \
  --api-id "$API_ID" \
  --region "$REGION" \
  --query 'Items[*].{RouteKey:RouteKey,Target:Target}' \
  --output table

echo ""
echo "🌐 URL del API: https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"


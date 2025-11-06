#!/bin/bash

# Script para migrar de API Gateway REST API v1 a HTTP API v2
# HTTP API v2 tiene mejor soporte para ALBs y es más eficiente

set -e

REGION="eu-north-1"
ALB_URL="http://gua-clinic-api-alb-766718797.eu-north-1.elb.amazonaws.com"
API_NAME="gua-clinic-api-v2"
STAGE_NAME="prod"

echo "🚀 Migrando a API Gateway HTTP API v2..."
echo ""

# Crear HTTP API
echo "1️⃣ Creando HTTP API..."
API_ID=$(aws apigatewayv2 create-api \
  --name "$API_NAME" \
  --protocol HTTP \
  --cors-configuration AllowOrigins="https://urologiayandrologia.com,https://www.urologiayandrologia.com,https://guaclinic.com,https://www.guaclinic.com,https://cdn.gua.com",AllowMethods="GET,POST,PUT,DELETE,OPTIONS",AllowHeaders="content-type,authorization,usu-apitoken",AllowCredentials=true \
  --region "$REGION" \
  --query 'ApiId' \
  --output text)

if [ -z "$API_ID" ]; then
  echo "❌ Error al crear HTTP API"
  exit 1
fi

echo "✅ HTTP API creada: $API_ID"
echo ""

# Obtener default route ID
echo "2️⃣ Configurando integración con ALB..."
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id "$API_ID" \
  --integration-type HTTP_PROXY \
  --integration-method ANY \
  --integration-uri "${ALB_URL}/{proxy}" \
  --payload-format-version "1.0" \
  --region "$REGION" \
  --query 'IntegrationId' \
  --output text)

echo "✅ Integración creada: $INTEGRATION_ID"
echo ""

# Crear ruta catch-all
echo "3️⃣ Creando ruta catch-all..."
ROUTE_ID=$(aws apigatewayv2 create-route \
  --api-id "$API_ID" \
  --route-key "\$default" \
  --target "integrations/$INTEGRATION_ID" \
  --region "$REGION" \
  --query 'RouteId' \
  --output text)

echo "✅ Ruta creada: $ROUTE_ID"
echo ""

# Crear stage
echo "4️⃣ Creando stage..."
STAGE_ID=$(aws apigatewayv2 create-stage \
  --api-id "$API_ID" \
  --stage-name "$STAGE_NAME" \
  --auto-deploy \
  --region "$REGION" \
  --query 'StageName' \
  --output text)

echo "✅ Stage creado: $STAGE_NAME"
echo ""

# Obtener URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"

echo "═══════════════════════════════════════════════════════════════"
echo "✅ MIGRACIÓN COMPLETADA"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Información:"
echo "   API ID: $API_ID"
echo "   Stage: $STAGE_NAME"
echo "   Region: $REGION"
echo ""
echo "🌐 Nueva URL HTTP API:"
echo "   $API_URL"
echo ""
echo "📝 Para usar en WordPress, actualiza el plugin:"
echo "   api_url='$API_URL'"
echo ""
echo "🧪 Prueba:"
echo "   curl $API_URL/bootstrap"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Actualiza el widget de WordPress con la nueva URL"
echo "   2. La antigua REST API v1 (4mbksaqi36) puede eliminarse después de verificar"
echo ""






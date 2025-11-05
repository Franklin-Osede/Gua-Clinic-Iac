#!/bin/bash

# Script para arreglar el catch-all de HTTP API v2 y eliminar REST APIs antiguas

set -e

REGION="eu-north-1"
ALB_URL="http://gua-clinic-api-alb-766718797.eu-north-1.elb.amazonaws.com"
HTTP_API_ID="ybymfv93yg"  # ID de la HTTP API v2 actual

echo "🔧 Arreglando catch-all de HTTP API v2..."
echo ""

# 1. Obtener la integración catch-all actual
echo "1️⃣ Buscando integración catch-all..."
CATCH_ALL_INTEGRATION_ID="hbtrr63"  # Ya sabemos que es hbtrr63

echo "   Integración encontrada: $CATCH_ALL_INTEGRATION_ID"
echo ""

# 2. Actualizar la integración para usar {proxy} correctamente
echo "2️⃣ Actualizando integración catch-all..."
aws apigatewayv2 update-integration \
  --api-id "$HTTP_API_ID" \
  --integration-id "$CATCH_ALL_INTEGRATION_ID" \
  --integration-uri "${ALB_URL}/{proxy}" \
  --request-parameters '{"overwrite:path":"$request.path"}' \
  --region "$REGION" > /dev/null

echo "✅ Integración actualizada correctamente"
echo ""

# 3. Verificar que funciona
echo "3️⃣ Verificando configuración..."
UPDATED_URI=$(aws apigatewayv2 get-integration \
  --api-id "$HTTP_API_ID" \
  --integration-id "$CATCH_ALL_INTEGRATION_ID" \
  --region "$REGION" \
  --query 'IntegrationUri' \
  --output text)

echo "   URI actualizada: $UPDATED_URI"
echo ""

# 4. Eliminar REST API Gateways antiguos
echo "═══════════════════════════════════════════════════════════════"
echo "🗑️  Eliminando REST API Gateways antiguos..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

REST_API_IDS=("4mbksaqi36" "a4car35mtg" "kjfzt3trne")

for API_ID in "${REST_API_IDS[@]}"; do
  echo "🗑️  Eliminando REST API: $API_ID"
  
  # Verificar que existe antes de intentar eliminarlo
  if aws apigateway get-rest-api --rest-api-id "$API_ID" --region "$REGION" > /dev/null 2>&1; then
    # Intentar eliminar
    if aws apigateway delete-rest-api --rest-api-id "$API_ID" --region "$REGION" 2>&1; then
      echo "   ✅ REST API eliminada: $API_ID"
    else
      echo "   ⚠️  No se pudo eliminar $API_ID (puede tener dependencias)"
    fi
  else
    echo "   ℹ️  REST API $API_ID no existe o ya fue eliminada"
  fi
  echo ""
done

echo "═══════════════════════════════════════════════════════════════"
echo "✅ PROCESO COMPLETADO"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🧪 Prueba el endpoint que fallaba:"
echo "   curl https://${HTTP_API_ID}.execute-api.${REGION}.amazonaws.com/prod/appointments-types/1"
echo ""
echo "📋 Verifica las rutas:"
echo "   aws apigatewayv2 get-routes --api-id $HTTP_API_ID --region $REGION"
echo ""



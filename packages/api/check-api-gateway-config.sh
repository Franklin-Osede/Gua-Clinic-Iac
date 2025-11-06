#!/bin/bash

# Script rápido para verificar la configuración de API Gateway y obtener detalles de integración

REGION="eu-north-1"
API_ID="4mbksaqi36"
STAGE_NAME="prod"

echo "🔍 Verificando configuración de API Gateway..."
echo ""

# Obtener recursos
echo "📋 Recursos disponibles:"
aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[*].{Path:path,Id:id,Methods:resourceMethods}' \
  --output table

echo ""
echo "───────────────────────────────────────────────────────────────"
echo ""

# Verificar integración de bootstrap
BOOTSTRAP_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query "items[?path=='/bootstrap'].id" \
  --output text 2>/dev/null || echo "")

if [ -n "$BOOTSTRAP_RESOURCE_ID" ] && [ "$BOOTSTRAP_RESOURCE_ID" != "None" ]; then
  echo "📝 Configuración completa de GET /bootstrap:"
  aws apigateway get-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$BOOTSTRAP_RESOURCE_ID" \
    --http-method GET \
    --region "$REGION" \
    --output json | jq '.'
fi

echo ""
echo "───────────────────────────────────────────────────────────────"
echo ""

# Verificar integración de medical-specialties
SPECIALTIES_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query "items[?path=='/medical-specialties'].id" \
  --output text 2>/dev/null || echo "")

if [ -n "$SPECIALTIES_RESOURCE_ID" ] && [ "$SPECIALTIES_RESOURCE_ID" != "None" ]; then
  echo "📝 Configuración completa de GET /medical-specialties:"
  aws apigateway get-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$SPECIALTIES_RESOURCE_ID" \
    --http-method GET \
    --region "$REGION" \
    --output json | jq '.'
fi

echo ""
echo "───────────────────────────────────────────────────────────────"
echo ""

# Verificar stage y deployment
echo "📦 Último deployment:"
aws apigateway get-stage \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE_NAME" \
  --region "$REGION" \
  --query '{DeploymentId:deploymentId,CreatedDate:createdDate,LastUpdatedDate:lastUpdatedDate}' \
  --output json | jq '.'






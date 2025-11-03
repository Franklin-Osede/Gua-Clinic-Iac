#!/bin/bash

# Script para encontrar métodos sin integración en API Gateway

API_ID="4mbksaqi36"
REGION="eu-north-1"

echo "🔍 Buscando métodos sin integración..."
echo ""

# Obtener todos los recursos
RESOURCES=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --output json)

# Procesar cada recurso
echo "$RESOURCES" | jq -r '.items[] | select(.resourceMethods != null) | "\(.id)|\(.path)|\(.resourceMethods | keys | join(","))"' | while IFS='|' read -r resource_id path methods; do
  echo "📋 $path (ID: $resource_id)"
  
  # Procesar cada método
  for method in $(echo "$methods" | tr ',' ' '); do
    if [ "$method" != "OPTIONS" ]; then
      # Verificar si tiene integración
      INTEGRATION=$(aws apigateway get-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "$method" \
        --region "$REGION" \
        --query 'uri' \
        --output text 2>&1)
      
      if echo "$INTEGRATION" | grep -q "None\|NotFound\|error"; then
        echo "  ❌ $method: Sin integración"
        echo "     Error: $INTEGRATION"
      else
        echo "  ✅ $method: OK"
      fi
    fi
  done
  echo ""
done



#!/bin/bash

# Script para crear API Gateway con proxy al backend ECS
# Resuelve el problema de Mixed Content (HTTPS → HTTP)

set -e

REGION="eu-north-1"
BACKEND_URL="http://13.53.131.249:3000"  # URL del backend ECS (actualizar si cambia)
API_NAME="gua-clinic-api-gateway"
STAGE_NAME="prod"

echo "🚀 Configurando API Gateway para GUA Clinic..."

# 1. Crear REST API
echo "📝 Creando REST API..."
API_ID=$(aws apigateway create-rest-api \
  --name "$API_NAME" \
  --description "API Gateway para GUA Clinic - Resuelve Mixed Content" \
  --region "$REGION" \
  --endpoint-configuration types=REGIONAL \
  --query 'id' \
  --output text)

if [ -z "$API_ID" ]; then
  echo "⚠️ La API ya existe, obteniendo ID..."
  API_ID=$(aws apigateway get-rest-apis \
    --region "$REGION" \
    --query "items[?name=='$API_NAME'].id" \
    --output text)
fi

echo "✅ API ID: $API_ID"

# 2. Obtener Root Resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[?path==`/`].id' \
  --output text)

echo "✅ Root Resource ID: $ROOT_ID"

# 3. Función para crear recurso y método
create_endpoint() {
  local PATH=$1
  local METHOD=$2
  
  echo "📌 Configurando: $METHOD $PATH"
  
  # Crear recurso si no existe
  RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query "items[?path=='$PATH'].id" \
    --output text)
  
  if [ -z "$RESOURCE_ID" ]; then
    # Crear recurso anidado
    PARENT_ID=$ROOT_ID
    IFS='/' read -ra PARTS <<< "${PATH#/}"
    
    for PART in "${PARTS[@]}"; do
      if [ -n "$PART" ]; then
        EXISTING_ID=$(aws apigateway get-resources \
          --rest-api-id "$API_ID" \
          --region "$REGION" \
          --query "items[?path=='/${PART}'].id" \
          --output text)
        
        if [ -n "$EXISTING_ID" ]; then
          PARENT_ID=$EXISTING_ID
        else
          NEW_RESOURCE=$(aws apigateway create-resource \
            --rest-api-id "$API_ID" \
            --parent-id "$PARENT_ID" \
            --path-part "$PART" \
            --region "$REGION")
          PARENT_ID=$(echo "$NEW_RESOURCE" | jq -r '.id')
        fi
      fi
    done
    
    RESOURCE_ID=$PARENT_ID
  fi
  
  # Crear método HTTP si no existe
  METHOD_EXISTS=$(aws apigateway get-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "$METHOD" \
    --region "$REGION" 2>/dev/null || echo "false")
  
  if [ "$METHOD_EXISTS" == "false" ]; then
    aws apigateway put-method \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method "$METHOD" \
      --authorization-type NONE \
      --region "$REGION" > /dev/null
    
    # Configurar integración HTTP Proxy
    aws apigateway put-integration \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method "$METHOD" \
      --type HTTP_PROXY \
      --integration-http-method "$METHOD" \
      --uri "${BACKEND_URL}${PATH}" \
      --region "$REGION" > /dev/null
    
    # Configurar respuesta 200
    aws apigateway put-method-response \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method "$METHOD" \
      --status-code 200 \
      --response-parameters method.response.header.Access-Control-Allow-Origin=false \
      --region "$REGION" > /dev/null
    
    aws apigateway put-integration-response \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method "$METHOD" \
      --status-code 200 \
      --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}' \
      --region "$REGION" > /dev/null
  fi
  
  echo "  ✅ $METHOD $PATH configurado"
}

# 4. Crear endpoints principales
create_endpoint "/bootstrap" "GET"
create_endpoint "/bootstrap" "POST"
create_endpoint "/medical-specialties" "GET"
create_endpoint "/doctors" "GET"
create_endpoint "/doctors/{doctorId}" "GET"
create_endpoint "/doctor-availability/{doctorId}/{startDate}" "GET"
create_endpoint "/appointments-types/{serviceId}" "GET"
create_endpoint "/patient/vat" "POST"
create_endpoint "/encrypted-patient" "POST"
create_endpoint "/appointment" "POST"
create_endpoint "/appointment/{trackingId}/status" "GET"
create_endpoint "/health" "GET"

# Crear recurso catch-all para rutas con parámetros dinámicos
# Usar {proxy+} para capturar todas las rutas
PROXY_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query "items[?path=='/{proxy+}'].id" \
  --output text)

if [ -z "$PROXY_RESOURCE_ID" ]; then
  PROXY_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_ID" \
    --path-part "{proxy+}" \
    --region "$REGION")
  PROXY_RESOURCE_ID=$(echo "$PROXY_RESOURCE" | jq -r '.id')
fi

# Configurar método ANY para proxy
ANY_EXISTS=$(aws apigateway get-method \
  --rest-api-id "$API_ID" \
  --resource-id "$PROXY_RESOURCE_ID" \
  --http-method "ANY" \
  --region "$REGION" 2>/dev/null || echo "false")

if [ "$ANY_EXISTS" == "false" ]; then
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method "ANY" \
    --authorization-type NONE \
    --region "$REGION" > /dev/null
  
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method "ANY" \
    --type HTTP_PROXY \
    --integration-http-method ANY \
    --uri "${BACKEND_URL}/{proxy}" \
    --region "$REGION" > /dev/null
  
  echo "✅ Proxy catch-all configurado"
fi

# 5. Desplegar API
echo "🚀 Desplegando API..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE_NAME" \
  --region "$REGION" \
  --query 'id' \
  --output text)

echo "✅ Deployment ID: $DEPLOYMENT_ID"

# 6. Obtener URL final
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"

echo ""
echo "=========================================="
echo "✅ API Gateway configurado exitosamente"
echo "=========================================="
echo ""
echo "📋 Información:"
echo "   API ID: $API_ID"
echo "   Stage: $STAGE_NAME"
echo "   Region: $REGION"
echo ""
echo "🌐 URL HTTPS del API Gateway:"
echo "   $API_URL"
echo ""
echo "📝 Para usar en WordPress, actualiza el plugin con:"
echo "   api_url='$API_URL'"
echo ""
echo "⚠️ IMPORTANTE: Actualiza el backend URL si cambia:"
echo "   BACKEND_URL='$BACKEND_URL'"
echo ""
echo "💡 Para verificar, prueba:"
echo "   curl $API_URL/health"
echo ""



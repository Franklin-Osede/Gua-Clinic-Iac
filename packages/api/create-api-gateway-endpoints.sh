#!/bin/bash
# Script para crear endpoints en API Gateway

export PATH="/opt/homebrew/bin:$PATH"
AWS="aws"
REGION="eu-north-1"
BACKEND_URL="http://13.53.131.86:3000"
API_ID="4mbksaqi36"
ROOT_ID="z70fwj0bxk"
STAGE_NAME="prod"

echo "🚀 Configurando endpoints en API Gateway..."

# Función para crear endpoint
create_endpoint() {
    local PATH_PART=$1
    local METHOD=$2
    
    echo "📌 Creando: $METHOD /$PATH_PART"
    
    # Crear recurso
    RESOURCE=$(aws apigateway create-resource \
        --rest-api-id "$API_ID" \
        --parent-id "$ROOT_ID" \
        --path-part "$PATH_PART" \
        --region "$REGION" 2>&1)
    
    RESOURCE_ID=$(echo "$RESOURCE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$RESOURCE_ID" ]; then
        # Intentar obtener recurso existente
        RESOURCE_ID=$(aws apigateway get-resources \
            --rest-api-id "$API_ID" \
            --region "$REGION" \
            --query "items[?path=='/$PATH_PART'].id" \
            --output text)
    fi
    
    if [ -z "$RESOURCE_ID" ]; then
        echo "  ❌ No se pudo crear/obtener recurso"
        return
    fi
    
    echo "  ✅ Resource ID: $RESOURCE_ID"
    
    # Crear método
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method "$METHOD" \
        --authorization-type NONE \
        --region "$REGION" > /dev/null 2>&1
    
    # Configurar integración
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method "$METHOD" \
        --type HTTP_PROXY \
        --integration-http-method "$METHOD" \
        --uri "${BACKEND_URL}/${PATH_PART}" \
        --region "$REGION" > /dev/null 2>&1
    
    # Configurar respuesta 200 con CORS
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method "$METHOD" \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false}' \
        --region "$REGION" > /dev/null 2>&1
    
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method "$METHOD" \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
        --region "$REGION" > /dev/null 2>&1
    
    echo "  ✅ Método $METHOD configurado"
}

# Crear endpoints principales
create_endpoint "bootstrap" "GET"
create_endpoint "bootstrap" "POST"
create_endpoint "medical-specialties" "GET"
create_endpoint "health" "GET"

# Crear proxy catch-all para rutas dinámicas
echo "📌 Creando proxy catch-all..."
PROXY_RESOURCE=$(aws apigateway create-resource \
    --rest-api-id "$API_ID" \
    --parent-id "$ROOT_ID" \
    --path-part "{proxy+}" \
    --region "$REGION" 2>&1)

PROXY_ID=$(echo "$PROXY_RESOURCE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$PROXY_ID" ]; then
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$PROXY_ID" \
        --http-method "ANY" \
        --authorization-type NONE \
        --region "$REGION" > /dev/null 2>&1
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$PROXY_ID" \
        --http-method "ANY" \
        --type HTTP_PROXY \
        --integration-http-method ANY \
        --uri "${BACKEND_URL}/{proxy}" \
        --region "$REGION" > /dev/null 2>&1
    
    echo "  ✅ Proxy catch-all configurado"
fi

# Desplegar
echo "🚀 Desplegando API..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE_NAME" \
    --region "$REGION" > /dev/null 2>&1

echo ""
echo "✅ Endpoints configurados!"
echo "🌐 URL: https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"
echo ""
echo "💡 Prueba: curl https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/health"

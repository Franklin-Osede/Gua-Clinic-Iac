#!/bin/bash
# Script para actualizar automáticamente la IP del backend en API Gateway
# Útil cuando la IP cambia después de reiniciar el servicio ECS

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"
API_ID="4mbksaqi36"

echo "🔄 Actualizando API Gateway con la IP actual del backend..."

# 1. Obtener IP actual del backend
echo "🔍 Obteniendo IP actual del backend..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'taskArns[0]' --output text)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo "❌ No se encontró ningún task ejecutándose"
  exit 1
fi

ENI_ID=$(aws ecs describe-tasks \
  --cluster "$CLUSTER_NAME" \
  --tasks "$TASK_ARN" \
  --region "$REGION" \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids "$ENI_ID" \
  --region "$REGION" \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; then
  echo "❌ No se pudo obtener la IP pública"
  exit 1
fi

BACKEND_URL="http://$PUBLIC_IP:3000"
echo "✅ IP del backend: $PUBLIC_IP"

# 2. Actualizar todas las integraciones del API Gateway
echo ""
echo "📝 Actualizando integraciones del API Gateway..."

# Lista de endpoints a actualizar
ENDPOINTS=("bootstrap" "medical-specialties" "health")

for endpoint in "${ENDPOINTS[@]}"; do
  echo "  📌 Actualizando /$endpoint..."
  
  # Obtener Resource ID
  RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query "items[?path=='/$endpoint'].id" \
    --output text 2>/dev/null)
  
  if [ -z "$RESOURCE_ID" ] || [ "$RESOURCE_ID" == "None" ]; then
    echo "    ⚠️  Endpoint /$endpoint no encontrado, saltando..."
    continue
  fi
  
  # Actualizar integración GET
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method GET \
    --type HTTP_PROXY \
    --integration-http-method GET \
    --uri "${BACKEND_URL}/${endpoint}" \
    --region "$REGION" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "    ✅ /$endpoint GET actualizado"
    
    # Configurar OPTIONS para CORS preflight
    echo "    📌 Configurando OPTIONS para CORS..."
    aws apigateway put-method \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --authorization-type NONE \
      --region "$REGION" > /dev/null 2>&1
    
    aws apigateway put-integration \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --type HTTP_PROXY \
      --integration-http-method OPTIONS \
      --uri "${BACKEND_URL}/${endpoint}" \
      --region "$REGION" > /dev/null 2>&1
    
    # Configurar respuesta OPTIONS con headers CORS
    aws apigateway put-method-response \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":false,\"method.response.header.Access-Control-Allow-Methods\":false,\"method.response.header.Access-Control-Allow-Origin\":false}" \
      --region "$REGION" > /dev/null 2>&1
    
    aws apigateway put-integration-response \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'*'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,Authorization,USU_APITOKEN'\"}" \
      --region "$REGION" > /dev/null 2>&1
    
    echo "    ✅ OPTIONS configurado para /$endpoint"
  else
    echo "    ❌ Error actualizando /$endpoint"
  fi
done

# 3. Actualizar proxy catch-all si existe
echo ""
echo "📝 Actualizando proxy catch-all..."
PROXY_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query "items[?path=='/{proxy+}'].id" \
  --output text 2>/dev/null)

if [ -n "$PROXY_RESOURCE_ID" ] && [ "$PROXY_RESOURCE_ID" != "None" ]; then
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$PROXY_RESOURCE_ID" \
    --http-method ANY \
    --type HTTP_PROXY \
    --integration-http-method ANY \
    --uri "${BACKEND_URL}/{proxy}" \
    --region "$REGION" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Proxy catch-all actualizado"
  else
    echo "  ❌ Error actualizando proxy catch-all"
  fi
fi

# 4. Desplegar cambios
echo ""
echo "🚀 Desplegando cambios en API Gateway..."
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "prod" \
  --region "$REGION" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Cambios desplegados correctamente"
else
  echo "⚠️  Advertencia: No se pudo crear deployment (puede que ya exista)"
fi

echo ""
echo "═══════════════════════════════════════"
echo "✅ ACTUALIZACIÓN COMPLETADA"
echo "═══════════════════════════════════════"
echo ""
echo "🌐 Backend URL: $BACKEND_URL"
echo "🌐 API Gateway: https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
echo ""
echo "💡 El API Gateway ahora apunta a la IP correcta"
echo ""


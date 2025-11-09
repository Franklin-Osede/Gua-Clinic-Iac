#!/bin/bash

# Script para diagnosticar problemas de 504 Gateway Timeout en API Gateway
# Verifica: estado de ECS, configuración de API Gateway, logs, y conectividad

set -e

REGION="eu-north-1"
API_ID="4mbksaqi36"
STAGE_NAME="prod"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 DIAGNÓSTICO DE 504 GATEWAY TIMEOUT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 1. VERIFICAR ESTADO DEL SERVICIO ECS
# ============================================================================
echo "📊 1. VERIFICANDO ESTADO DEL SERVICIO ECS..."
echo "───────────────────────────────────────────────────────────────"

SERVICE_STATUS=$(aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount}' \
  --output json 2>/dev/null || echo '{}')

if [ "$SERVICE_STATUS" == "{}" ]; then
  echo "❌ No se pudo obtener información del servicio ECS"
  echo "   Verifica que el cluster y servicio existan"
else
  echo "$SERVICE_STATUS" | jq '.'
  
  RUNNING_COUNT=$(echo "$SERVICE_STATUS" | jq -r '.RunningCount // 0')
  DESIRED_COUNT=$(echo "$SERVICE_STATUS" | jq -r '.DesiredCount // 0')
  
  if [ "$RUNNING_COUNT" -eq 0 ]; then
    echo ""
    echo "⚠️  PROBLEMA DETECTADO: No hay tareas ejecutándose (RunningCount: $RUNNING_COUNT)"
    echo "   El servicio ECS puede estar detenido o fallando"
  elif [ "$RUNNING_COUNT" -lt "$DESIRED_COUNT" ]; then
    echo ""
    echo "⚠️  PROBLEMA DETECTADO: Tareas insuficientes (Running: $RUNNING_COUNT, Desired: $DESIRED_COUNT)"
  fi
fi

echo ""
echo ""

# ============================================================================
# 2. OBTENER IP ACTUAL DEL BACKEND ECS
# ============================================================================
echo "🌐 2. OBTENIENDO IP ACTUAL DEL BACKEND ECS..."
echo "───────────────────────────────────────────────────────────────"

TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'taskArns[0]' \
  --output text 2>/dev/null || echo "")

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo "❌ No se encontró ningún task ejecutándose"
  CURRENT_BACKEND_IP="NO_DISPONIBLE"
else
  echo "✅ Task ARN encontrado: $TASK_ARN"
  
  ENI_ID=$(aws ecs describe-tasks \
    --cluster "$CLUSTER_NAME" \
    --tasks "$TASK_ARN" \
    --region "$REGION" \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
    --output text 2>/dev/null || echo "")
  
  if [ -z "$ENI_ID" ] || [ "$ENI_ID" == "None" ]; then
    echo "❌ No se pudo obtener el Network Interface ID"
    CURRENT_BACKEND_IP="NO_DISPONIBLE"
  else
    PUBLIC_IP=$(aws ec2 describe-network-interfaces \
      --network-interface-ids "$ENI_ID" \
      --region "$REGION" \
      --query 'NetworkInterfaces[0].Association.PublicIp' \
      --output text 2>/dev/null || echo "")
    
    if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; then
      echo "❌ No se pudo obtener la IP pública"
      CURRENT_BACKEND_IP="NO_DISPONIBLE"
    else
      CURRENT_BACKEND_IP="$PUBLIC_IP"
      CURRENT_BACKEND_URL="http://${PUBLIC_IP}:3000"
      echo "✅ IP del backend ECS: $CURRENT_BACKEND_IP"
      echo "✅ URL del backend: $CURRENT_BACKEND_URL"
    fi
  fi
fi

echo ""
echo ""

# ============================================================================
# 3. VERIFICAR CONFIGURACIÓN DE API GATEWAY - Recursos y Métodos
# ============================================================================
echo "🔧 3. VERIFICANDO CONFIGURACIÓN DE API GATEWAY..."
echo "───────────────────────────────────────────────────────────────"

echo "📋 Recursos configurados:"
aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[*].{Path:path,Id:id}' \
  --output table 2>/dev/null || echo "❌ Error al obtener recursos"

echo ""
echo "📋 Verificando endpoints problemáticos..."

# Verificar endpoint bootstrap
BOOTSTRAP_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query "items[?path=='/bootstrap'].id" \
  --output text 2>/dev/null || echo "")

if [ -n "$BOOTSTRAP_RESOURCE_ID" ] && [ "$BOOTSTRAP_RESOURCE_ID" != "None" ]; then
  echo ""
  echo "✅ Endpoint /bootstrap encontrado (Resource ID: $BOOTSTRAP_RESOURCE_ID)"
  
  echo ""
  echo "📝 Configuración de integración GET /bootstrap:"
  aws apigateway get-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$BOOTSTRAP_RESOURCE_ID" \
    --http-method GET \
    --region "$REGION" \
    --query '{Type:type,Uri:uri,HttpMethod:httpMethod,TimeoutInMillis:timeoutInMillis,ConnectionType:connectionType}' \
    --output json 2>/dev/null | jq '.' || echo "❌ Error al obtener integración"
else
  echo "⚠️  Endpoint /bootstrap no encontrado"
fi

# Verificar endpoint medical-specialties
SPECIALTIES_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query "items[?path=='/medical-specialties'].id" \
  --output text 2>/dev/null || echo "")

if [ -n "$SPECIALTIES_RESOURCE_ID" ] && [ "$SPECIALTIES_RESOURCE_ID" != "None" ]; then
  echo ""
  echo "✅ Endpoint /medical-specialties encontrado (Resource ID: $SPECIALTIES_RESOURCE_ID)"
  
  echo ""
  echo "📝 Configuración de integración GET /medical-specialties:"
  aws apigateway get-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$SPECIALTIES_RESOURCE_ID" \
    --http-method GET \
    --region "$REGION" \
    --query '{Type:type,Uri:uri,HttpMethod:httpMethod,TimeoutInMillis:timeoutInMillis,ConnectionType:connectionType}' \
    --output json 2>/dev/null | jq '.' || echo "❌ Error al obtener integración"
else
  echo "⚠️  Endpoint /medical-specialties no encontrado"
fi

echo ""
echo ""

# ============================================================================
# 4. COMPARAR IPs - Verificar si API Gateway apunta a la IP correcta
# ============================================================================
echo "🔍 4. VERIFICANDO COINCIDENCIA DE IPs..."
echo "───────────────────────────────────────────────────────────────"

if [ "$CURRENT_BACKEND_IP" != "NO_DISPONIBLE" ] && [ -n "$BOOTSTRAP_RESOURCE_ID" ]; then
  API_GATEWAY_URI=$(aws apigateway get-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$BOOTSTRAP_RESOURCE_ID" \
    --http-method GET \
    --region "$REGION" \
    --query 'uri' \
    --output text 2>/dev/null || echo "")
  
  if [[ "$API_GATEWAY_URI" == *"$CURRENT_BACKEND_IP"* ]]; then
    echo "✅ API Gateway apunta a la IP correcta: $CURRENT_BACKEND_IP"
  else
    echo "⚠️  PROBLEMA DETECTADO: Desajuste de IP"
    echo "   API Gateway URI: $API_GATEWAY_URI"
    echo "   IP actual del backend: $CURRENT_BACKEND_IP"
    echo ""
    echo "💡 SOLUCIÓN: Actualizar la integración de API Gateway con la nueva IP"
    echo "   Ejecuta: ./create-api-gateway-endpoints.sh (actualizando BACKEND_URL)"
  fi
else
  echo "⚠️  No se pudo verificar la coincidencia de IPs"
fi

echo ""
echo ""

# ============================================================================
# 5. VERIFICAR TIMEOUTS EN LA CONFIGURACIÓN
# ============================================================================
echo "⏱️  5. VERIFICANDO CONFIGURACIÓN DE TIMEOUTS..."
echo "───────────────────────────────────────────────────────────────"

if [ -n "$BOOTSTRAP_RESOURCE_ID" ]; then
  TIMEOUT=$(aws apigateway get-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$BOOTSTRAP_RESOURCE_ID" \
    --http-method GET \
    --region "$REGION" \
    --query 'timeoutInMillis' \
    --output text 2>/dev/null || echo "29000")
  
  if [ -z "$TIMEOUT" ] || [ "$TIMEOUT" == "None" ]; then
    TIMEOUT="29000"
  fi
  
  TIMEOUT_SECONDS=$((TIMEOUT / 1000))
  echo "⏱️  Timeout configurado: ${TIMEOUT}ms (${TIMEOUT_SECONDS}s)"
  
  if [ "$TIMEOUT" -lt 29000 ]; then
    echo "⚠️  Timeout muy bajo. API Gateway tiene un máximo de 29000ms (29s)"
  fi
  
  echo ""
  echo "💡 Nota: API Gateway tiene un timeout máximo de 29 segundos."
  echo "   Si tu backend tarda más, obtendrás un 504 Gateway Timeout."
fi

echo ""
echo ""

# ============================================================================
# 6. PROBAR CONECTIVIDAD DIRECTA AL BACKEND
# ============================================================================
echo "🌐 6. PROBANDO CONECTIVIDAD DIRECTA AL BACKEND..."
echo "───────────────────────────────────────────────────────────────"

if [ "$CURRENT_BACKEND_IP" != "NO_DISPONIBLE" ]; then
  echo "Probando: $CURRENT_BACKEND_URL/bootstrap"
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 10 \
    "$CURRENT_BACKEND_URL/bootstrap" 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Backend responde correctamente (HTTP $HTTP_CODE)"
  elif [ "$HTTP_CODE" == "000" ]; then
    echo "❌ PROBLEMA DETECTADO: Backend no responde o timeout"
    echo "   El servicio puede estar caído o no accesible"
  else
    echo "⚠️  Backend responde con código: $HTTP_CODE"
  fi
  
  echo ""
  echo "Probando: $CURRENT_BACKEND_URL/medical-specialties"
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 10 \
    "$CURRENT_BACKEND_URL/medical-specialties" 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Backend responde correctamente (HTTP $HTTP_CODE)"
  elif [ "$HTTP_CODE" == "000" ]; then
    echo "❌ PROBLEMA DETECTADO: Backend no responde o timeout"
  else
    echo "⚠️  Backend responde con código: $HTTP_CODE"
  fi
else
  echo "⚠️  No se pudo probar conectividad (IP no disponible)"
fi

echo ""
echo ""

# ============================================================================
# 7. VERIFICAR LOGS DE CLOUDWATCH
# ============================================================================
echo "📋 7. VERIFICANDO LOGS RECIENTES DE CLOUDWATCH..."
echo "───────────────────────────────────────────────────────────────"

LOG_GROUP_NAME="/aws/ecs/$CLUSTER_NAME"

echo "Buscando log group: $LOG_GROUP_NAME"
LOG_GROUPS=$(aws logs describe-log-groups \
  --region "$REGION" \
  --log-group-name-prefix "$LOG_GROUP_NAME" \
  --query 'logGroups[*].logGroupName' \
  --output json 2>/dev/null || echo "[]")

if [ "$LOG_GROUPS" != "[]" ]; then
  echo "✅ Log groups encontrados:"
  echo "$LOG_GROUPS" | jq -r '.[]' | head -5
  
  echo ""
  echo "📝 Últimas 10 líneas de logs (pueden tardar unos segundos):"
  
  # Obtener el log stream más reciente
  LATEST_LOG_GROUP=$(echo "$LOG_GROUPS" | jq -r '.[0]')
  
  if [ -n "$LATEST_LOG_GROUP" ] && [ "$LATEST_LOG_GROUP" != "null" ]; then
    LOG_STREAMS=$(aws logs describe-log-streams \
      --log-group-name "$LATEST_LOG_GROUP" \
      --region "$REGION" \
      --order-by LastEventTime \
      --descending \
      --max-items 1 \
      --query 'logStreams[0].logStreamName' \
      --output text 2>/dev/null || echo "")
    
    if [ -n "$LOG_STREAMS" ] && [ "$LOG_STREAMS" != "None" ]; then
      aws logs get-log-events \
        --log-group-name "$LATEST_LOG_GROUP" \
        --log-stream-name "$LOG_STREAMS" \
        --region "$REGION" \
        --limit 10 \
        --query 'events[*].message' \
        --output text 2>/dev/null | tail -10 || echo "No se pudieron obtener logs"
    fi
  fi
else
  echo "⚠️  No se encontraron log groups"
fi

echo ""
echo ""

# ============================================================================
# 8. RESUMEN Y RECOMENDACIONES
# ============================================================================
echo "═══════════════════════════════════════════════════════════════"
echo "📋 RESUMEN Y RECOMENDACIONES"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "🔍 Próximos pasos recomendados:"
echo ""
echo "1. Si el servicio ECS no está ejecutándose:"
echo "   aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 1 --region $REGION"
echo ""
echo "2. Si la IP del backend cambió:"
echo "   - Actualiza BACKEND_URL en create-api-gateway-endpoints.sh"
echo "   - Ejecuta: ./create-api-gateway-endpoints.sh"
echo ""
echo "3. Si el backend responde lentamente:"
echo "   - Verifica los logs de CloudWatch para errores"
echo "   - Revisa la configuración de la base de datos"
echo "   - Considera aumentar recursos del task ECS"
echo ""
echo "4. Verificar logs detallados:"
echo "   aws logs tail /aws/ecs/$CLUSTER_NAME --follow --region $REGION"
echo ""
echo "5. Probar endpoint directamente desde API Gateway:"
echo "   curl -v https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}/health"
echo ""

if [ "$CURRENT_BACKEND_IP" != "NO_DISPONIBLE" ]; then
  echo "═══════════════════════════════════════════════════════════════"
  echo "🔧 COMANDO PARA ACTUALIZAR API GATEWAY (si es necesario):"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "Backend URL actual: http://${CURRENT_BACKEND_IP}:3000"
  echo ""
  echo "1. Edita create-api-gateway-endpoints.sh y actualiza:"
  echo "   BACKEND_URL=\"http://${CURRENT_BACKEND_IP}:3000\""
  echo ""
  echo "2. Ejecuta:"
  echo "   ./create-api-gateway-endpoints.sh"
  echo ""
fi

echo ""
echo "✅ Diagnóstico completo"









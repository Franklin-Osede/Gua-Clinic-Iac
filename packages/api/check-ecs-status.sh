#!/bin/bash

# Script rápido para verificar el estado de ECS y obtener la IP actual

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"

echo "🔍 Verificando estado de ECS..."
echo ""

# Estado del servicio
echo "📊 Estado del servicio:"
aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'services[0].{
    Status:status,
    RunningCount:runningCount,
    DesiredCount:desiredCount,
    PendingCount:pendingCount,
    TaskDefinition:taskDefinition,
    LaunchType:launchType
  }' \
  --output json | jq '.'

echo ""
echo "───────────────────────────────────────────────────────────────"
echo ""

# Obtener IP actual
echo "🌐 Obteniendo IP del backend..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'taskArns[0]' \
  --output text 2>/dev/null || echo "")

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo "❌ No hay tasks ejecutándose"
else
  echo "✅ Task ARN: $TASK_ARN"
  
  ENI_ID=$(aws ecs describe-tasks \
    --cluster "$CLUSTER_NAME" \
    --tasks "$TASK_ARN" \
    --region "$REGION" \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
    --output text 2>/dev/null || echo "")
  
  if [ -n "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
    PUBLIC_IP=$(aws ec2 describe-network-interfaces \
      --network-interface-ids "$ENI_ID" \
      --region "$REGION" \
      --query 'NetworkInterfaces[0].Association.PublicIp' \
      --output text 2>/dev/null || echo "")
    
    if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
      echo "✅ IP pública: $PUBLIC_IP"
      echo "✅ URL del backend: http://$PUBLIC_IP:3000"
      
      echo ""
      echo "🧪 Probando conectividad..."
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://$PUBLIC_IP:3000/health" 2>/dev/null || echo "000")
      
      if [ "$HTTP_CODE" == "200" ]; then
        echo "✅ Backend responde correctamente"
      else
        echo "⚠️  Backend responde con código: $HTTP_CODE o no responde"
      fi
    else
      echo "❌ No se pudo obtener la IP pública"
    fi
  else
    echo "❌ No se pudo obtener el Network Interface ID"
  fi
fi

echo ""
echo "───────────────────────────────────────────────────────────────"
echo ""

# Información de las tareas
echo "📋 Tareas actuales:"
aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION" \
  --output table






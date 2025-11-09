#!/bin/bash

# Script para ver logs de CloudWatch del servicio ECS

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"
LOG_GROUP_NAME="/aws/ecs/$CLUSTER_NAME"

echo "📋 Verificando logs de CloudWatch..."
echo ""

# Listar log groups
echo "📊 Log groups disponibles:"
aws logs describe-log-groups \
  --region "$REGION" \
  --log-group-name-prefix "/aws/ecs/" \
  --query 'logGroups[*].{Name:logGroupName,StoredBytes:storedBytes,RetentionInDays:retentionInDays}' \
  --output table

echo ""
echo "───────────────────────────────────────────────────────────────"
echo ""

# Ver últimas líneas del log más reciente
LOG_GROUPS=$(aws logs describe-log-groups \
  --region "$REGION" \
  --log-group-name-prefix "$LOG_GROUP_NAME" \
  --query 'logGroups[*].logGroupName' \
  --output json 2>/dev/null || echo "[]")

if [ "$LOG_GROUPS" != "[]" ]; then
  LATEST_LOG_GROUP=$(echo "$LOG_GROUPS" | jq -r '.[0]')
  
  if [ -n "$LATEST_LOG_GROUP" ] && [ "$LATEST_LOG_GROUP" != "null" ]; then
    echo "📝 Últimas 20 líneas del log group: $LATEST_LOG_GROUP"
    echo ""
    
    LOG_STREAMS=$(aws logs describe-log-streams \
      --log-group-name "$LATEST_LOG_GROUP" \
      --region "$REGION" \
      --order-by LastEventTime \
      --descending \
      --max-items 1 \
      --query 'logStreams[0].logStreamName' \
      --output text 2>/dev/null || echo "")
    
    if [ -n "$LOG_STREAMS" ] && [ "$LOG_STREAMS" != "None" ]; then
      echo "Log stream: $LOG_STREAMS"
      echo ""
      aws logs get-log-events \
        --log-group-name "$LATEST_LOG_GROUP" \
        --log-stream-name "$LOG_STREAMS" \
        --region "$REGION" \
        --limit 20 \
        --query 'events[*].message' \
        --output text 2>/dev/null | tail -20
    else
      echo "⚠️  No se encontraron log streams"
    fi
  fi
else
  echo "⚠️  No se encontraron log groups para $LOG_GROUP_NAME"
fi

echo ""
echo ""
echo "💡 Para seguir los logs en tiempo real, ejecuta:"
echo "   aws logs tail $LATEST_LOG_GROUP --follow --region $REGION"









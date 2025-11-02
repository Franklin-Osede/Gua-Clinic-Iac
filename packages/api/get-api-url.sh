#!/bin/bash

# Script para obtener la URL pública de la API desplegada
# Útil cuando la IP cambia después de reiniciar el servicio

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"

echo "🔍 Obteniendo URL de la API..."
echo ""

# Obtener task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'taskArns[0]' --output text)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo "❌ No se encontró ningún task ejecutándose"
  echo "   Verifica que el servicio esté activo:"
  echo "   aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
  exit 1
fi

echo "📋 Task ARN: $TASK_ARN"
echo ""

# Obtener ENI ID
ENI_ID=$(aws ecs describe-tasks \
  --cluster "$CLUSTER_NAME" \
  --tasks "$TASK_ARN" \
  --region "$REGION" \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

if [ -z "$ENI_ID" ] || [ "$ENI_ID" == "None" ]; then
  echo "⚠️  No se pudo obtener el Network Interface ID"
  exit 1
fi

# Obtener IP pública
PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids "$ENI_ID" \
  --region "$REGION" \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "None" ]; then
  echo "❌ No se pudo obtener la IP pública"
  exit 1
fi

echo "═══════════════════════════════════════"
echo "🌐 API URL:"
echo "═══════════════════════════════════════"
echo ""
echo "   http://$PUBLIC_IP:3000"
echo ""
echo "📋 Endpoints:"
echo "   - http://$PUBLIC_IP:3000/bootstrap"
echo "   - http://$PUBLIC_IP:3000/medical-specialties"
echo "   - http://$PUBLIC_IP:3000/doctors"
echo "   - http://$PUBLIC_IP:3000/appointments"
echo "   - http://$PUBLIC_IP:3000/api/docs"
echo ""
echo "💡 Para actualizar WordPress:"
echo "   Actualiza la URL en el widget: api_url=\"http://$PUBLIC_IP:3000\""
echo ""


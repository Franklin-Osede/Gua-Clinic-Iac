#!/bin/bash

echo "🔧 Arreglando Security Group..."

REGION="eu-north-1"

# Obtener Security Groups
ALB_SG=$(aws elbv2 describe-load-balancers --region "$REGION" --names gua-clinic-api-alb --query 'LoadBalancers[0].SecurityGroups[0]' --output text)
ECS_SG=$(aws ecs describe-services --cluster gua-clinic-api --services gua-clinic-api-service --region "$REGION" --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups[0]' --output text)

echo "ALB Security Group: $ALB_SG"
echo "ECS Security Group: $ECS_SG"
echo ""

echo "Agregando regla: Puerto 3000 desde ALB a ECS..."
aws ec2 authorize-security-group-ingress \
  --group-id "$ECS_SG" \
  --protocol tcp \
  --port 3000 \
  --source-group "$ALB_SG" \
  --region "$REGION"

echo ""
echo "✅ Completado. Espera 1-2 minutos y verifica targets nuevamente."









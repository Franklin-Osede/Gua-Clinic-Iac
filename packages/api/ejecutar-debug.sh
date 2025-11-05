#!/bin/bash

echo "🔍 DIAGNÓSTICO 504 - Ejecutando..."
echo ""

echo "1️⃣ Estado de Targets (MÁS IMPORTANTE):"
echo "════════════════════════════════════════"
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:eu-north-1:258591805733:targetgroup/gua-clinic-api-tg/cfe72e7debd49b46 \
  --region eu-north-1 \
  --output table

echo ""
echo "2️⃣ ALB DNS:"
echo "════════════════════════════════════════"
aws elbv2 describe-load-balancers \
  --region eu-north-1 \
  --names gua-clinic-api-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text

echo ""
echo ""
echo "3️⃣ ECS Tasks ejecutándose:"
echo "════════════════════════════════════════"
aws ecs describe-services \
  --cluster gua-clinic-api \
  --services gua-clinic-api-service \
  --region eu-north-1 \
  --query 'services[0].{Desired:desiredCount,Running:runningCount}' \
  --output table

echo ""
echo "4️⃣ API Gateway Integration:"
echo "════════════════════════════════════════"
BOOTSTRAP_ID=$(aws apigateway get-resources --rest-api-id 4mbksaqi36 --region eu-north-1 --query "items[?path=='/bootstrap'].id" --output text)
if [ ! -z "$BOOTSTRAP_ID" ]; then
  aws apigateway get-integration \
    --rest-api-id 4mbksaqi36 \
    --resource-id "$BOOTSTRAP_ID" \
    --http-method GET \
    --region eu-north-1 \
    --query 'uri' \
    --output text
else
  echo "No se encontró /bootstrap"
fi

echo ""
echo ""
echo "✅ Diagnóstico completo"
echo ""
echo "Si ves targets 'unhealthy', ejecuta:"
echo "  ./fix-security-group.sh"




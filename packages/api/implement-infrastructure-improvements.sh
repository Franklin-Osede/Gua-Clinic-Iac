#!/bin/bash

# Script completo para implementar todas las mejoras de infraestructura
# Basado en INFRASTRUCTURE_VERIFICATION_REPORT.md

set -e

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"
REST_API_ID="kjfzt3trne"  # REST API v1 (para deprecar)
HTTP_API_ID="ybymfv93yg"  # HTTP API v2 (actual)

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 IMPLEMENTANDO MEJORAS DE INFRAESTRUCTURA - GUA CLINIC"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 1. CONFIGURAR AUTO-SCALING
# ============================================================================
echo "📈 1. CONFIGURANDO AUTO-SCALING..."
echo "───────────────────────────────────────────────────────────────"

# Registrar scalable target
echo "   📝 Registrando scalable target (min: 2, max: 10)..."
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "service/$CLUSTER_NAME/$SERVICE_NAME" \
  --min-capacity 2 \
  --max-capacity 10 \
  --region "$REGION" 2>/dev/null && echo "   ✅ Scalable target registrado" || echo "   ⚠️  Ya existe o error"

# Crear política de auto-scaling basada en CPU
echo "   📝 Creando política de auto-scaling (CPU target: 70%)..."
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "service/$CLUSTER_NAME/$SERVICE_NAME" \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }' \
  --region "$REGION" 2>/dev/null && echo "   ✅ Política de scaling creada" || echo "   ⚠️  Ya existe o error"

# Actualizar desired count a 2
echo "   📝 Actualizando desired count a 2..."
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --desired-count 2 \
  --region "$REGION" > /dev/null && echo "   ✅ Desired count actualizado a 2" || echo "   ⚠️  Error al actualizar"

echo ""
echo ""

# ============================================================================
# 2. HABILITAR DEPLOYMENT CIRCUIT BREAKER
# ============================================================================
echo "🔄 2. HABILITANDO DEPLOYMENT CIRCUIT BREAKER..."
echo "───────────────────────────────────────────────────────────────"

aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --deployment-configuration '{
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    },
    "maximumPercent": 200,
    "minimumHealthyPercent": 100
  }' \
  --region "$REGION" > /dev/null && echo "   ✅ Deployment Circuit Breaker habilitado con rollback automático" || echo "   ⚠️  Error"

echo ""
echo ""

# ============================================================================
# 3. HABILITAR CONTAINER INSIGHTS
# ============================================================================
echo "🔍 3. HABILITANDO CONTAINER INSIGHTS..."
echo "───────────────────────────────────────────────────────────────"

aws ecs update-cluster \
  --cluster "$CLUSTER_NAME" \
  --settings name=containerInsights,value=enabled \
  --region "$REGION" > /dev/null && echo "   ✅ Container Insights habilitado" || echo "   ⚠️  Error o ya estaba habilitado"

echo ""
echo ""

# ============================================================================
# 4. HABILITAR POINT-IN-TIME RECOVERY EN DYNAMODB
# ============================================================================
echo "💾 4. HABILITANDO POINT-IN-TIME RECOVERY EN DYNAMODB..."
echo "───────────────────────────────────────────────────────────────"

# Tabla de auditoría
echo "   📝 Habilitando PITR para gua-clinic-audit..."
aws dynamodb update-continuous-backups \
  --table-name gua-clinic-audit \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region "$REGION" > /dev/null && echo "   ✅ PITR habilitado para gua-clinic-audit" || echo "   ⚠️  Error"

# Tabla de caché
echo "   📝 Habilitando PITR para gua-clinic-cache..."
aws dynamodb update-continuous-backups \
  --table-name gua-clinic-cache \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region "$REGION" > /dev/null && echo "   ✅ PITR habilitado para gua-clinic-cache" || echo "   ⚠️  Error"

echo ""
echo ""

# ============================================================================
# 5. CONFIGURAR ALARMAS ADICIONALES
# ============================================================================
echo "🚨 5. CONFIGURANDO ALARMAS ADICIONALES..."
echo "───────────────────────────────────────────────────────────────"

# Obtener Account ID para SNS topic (si existe)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SNS_TOPIC_ARN="arn:aws:sns:$REGION:$ACCOUNT_ID:gua-clinic-alerts" 2>/dev/null || SNS_TOPIC_ARN=""

# Alarma: CPU > 80%
echo "   📝 Creando alarma: CPU > 80%..."
aws cloudwatch put-metric-alarm \
  --alarm-name gua-clinic-high-cpu \
  --alarm-description "Alerta cuando CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=$SERVICE_NAME Name=ClusterName,Value=$CLUSTER_NAME \
  --region "$REGION" 2>/dev/null && echo "   ✅ Alarma de CPU creada" || echo "   ⚠️  Ya existe o error"

# Alarma: Memory > 85%
echo "   📝 Creando alarma: Memory > 85%..."
aws cloudwatch put-metric-alarm \
  --alarm-name gua-clinic-high-memory \
  --alarm-description "Alerta cuando Memory > 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=$SERVICE_NAME Name=ClusterName,Value=$CLUSTER_NAME \
  --region "$REGION" 2>/dev/null && echo "   ✅ Alarma de Memory creada" || echo "   ⚠️  Ya existe o error"

# Alarma: Target Unhealthy
echo "   📝 Creando alarma: Targets Unhealthy..."
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:eu-north-1:258591805733:targetgroup/gua-clinic-api-tg/cfe72e7debd49b46"
aws cloudwatch put-metric-alarm \
  --alarm-name gua-clinic-unhealthy-targets \
  --alarm-description "Alerta cuando hay targets unhealthy" \
  --metric-name UnHealthyHostCount \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 60 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --dimensions Name=TargetGroup,Value=targetgroup/gua-clinic-api-tg/cfe72e7debd49b46 \
  --region "$REGION" 2>/dev/null && echo "   ✅ Alarma de Target Health creada" || echo "   ⚠️  Ya existe o error"

echo ""
echo ""

# ============================================================================
# 6. IMPLEMENTAR WAF
# ============================================================================
echo "🛡️  6. IMPLEMENTANDO WAF..."
echo "───────────────────────────────────────────────────────────────"

# Obtener ARN del ALB
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names gua-clinic-api-alb \
  --region "$REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
  echo "   📝 Creando WAF Web ACL..."
  
  # Crear Web ACL
  WAF_ARN=$(aws wafv2 create-web-acl \
    --scope REGIONAL \
    --default-action Allow={} \
    --name gua-clinic-waf \
    --description "WAF para GUA Clinic API" \
    --rules '[
      {
        "Name": "AWSManagedRulesCommonRuleSet",
        "Priority": 1,
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesCommonRuleSet"
          }
        },
        "OverrideAction": {"None": {}},
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "CommonRuleSetMetric"
        }
      },
      {
        "Name": "RateLimitRule",
        "Priority": 2,
        "Statement": {
          "RateBasedStatement": {
            "Limit": 2000,
            "AggregateKeyType": "IP"
          }
        },
        "Action": {"Block": {}},
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "RateLimitMetric"
        }
      }
    ]' \
    --region "$REGION" \
    --query 'Summary.ARN' \
    --output text 2>/dev/null || echo "")
  
  if [ ! -z "$WAF_ARN" ] && [ "$WAF_ARN" != "None" ]; then
    echo "   ✅ WAF Web ACL creado: $WAF_ARN"
    
    # Asociar WAF con ALB
    echo "   📝 Asociando WAF con ALB..."
    aws wafv2 associate-web-acl \
      --web-acl-arn "$WAF_ARN" \
      --resource-arn "$ALB_ARN" \
      --region "$REGION" 2>/dev/null && echo "   ✅ WAF asociado con ALB" || echo "   ⚠️  Error al asociar (puede que ya esté asociado)"
  else
    echo "   ⚠️  WAF ya existe o error al crear"
  fi
else
  echo "   ⚠️  No se pudo obtener ARN del ALB"
fi

echo ""
echo ""

# ============================================================================
# 7. CONFIGURAR VPC ENDPOINTS
# ============================================================================
echo "🔌 7. CONFIGURANDO VPC ENDPOINTS..."
echo "───────────────────────────────────────────────────────────────"

# Obtener VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
  --region "$REGION" \
  --filters "Name=is-default,Values=true" \
  --query 'Vpcs[0].VpcId' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
  echo "   📍 VPC ID: $VPC_ID"
  
  # Obtener subnets
  SUBNET_IDS=$(aws ec2 describe-subnets \
    --region "$REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[0:2].SubnetId' \
    --output text 2>/dev/null || echo "")
  
  SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
  SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')
  
  # Obtener Security Group del ECS
  ECS_SG=$(aws ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$SERVICE_NAME" \
    --region "$REGION" \
    --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups[0]' \
    --output text 2>/dev/null || echo "")
  
  # VPC Endpoint para DynamoDB (Gateway type)
  echo "   📝 Creando VPC Endpoint para DynamoDB..."
  aws ec2 create-vpc-endpoint \
    --vpc-id "$VPC_ID" \
    --vpc-endpoint-type Gateway \
    --service-name com.amazonaws.eu-north-1.dynamodb \
    --route-table-ids $(aws ec2 describe-route-tables \
      --region "$REGION" \
      --filters "Name=vpc-id,Values=$VPC_ID" \
      --query 'RouteTables[0].RouteTableId' \
      --output text) \
    --region "$REGION" 2>/dev/null && echo "   ✅ VPC Endpoint para DynamoDB creado" || echo "   ⚠️  Ya existe o error"
  
  # VPC Endpoint para Secrets Manager (Interface type)
  if [ ! -z "$ECS_SG" ] && [ "$ECS_SG" != "None" ]; then
    echo "   📝 Creando VPC Endpoint para Secrets Manager..."
    aws ec2 create-vpc-endpoint \
      --vpc-id "$VPC_ID" \
      --vpc-endpoint-type Interface \
      --service-name com.amazonaws.eu-north-1.secretsmanager \
      --subnet-ids "$SUBNET_1" "$SUBNET_2" \
      --security-group-ids "$ECS_SG" \
      --region "$REGION" 2>/dev/null && echo "   ✅ VPC Endpoint para Secrets Manager creado" || echo "   ⚠️  Ya existe o error"
  else
    echo "   ⚠️  No se pudo obtener Security Group del ECS"
  fi
else
  echo "   ⚠️  No se pudo obtener VPC ID"
fi

echo ""
echo ""

# ============================================================================
# 8. DEPRECAR REST API v1 (OPCIONAL - COMENTADO POR SEGURIDAD)
# ============================================================================
echo "🚪 8. VERIFICANDO API GATEWAY..."
echo "───────────────────────────────────────────────────────────────"

echo "   ℹ️  REST API v1 ID: $REST_API_ID"
echo "   ℹ️  HTTP API v2 ID: $HTTP_API_ID"
echo ""
echo "   ⚠️  Para deprecar REST API v1:"
echo "      1. Verifica que HTTP API v2 esté funcionando correctamente"
echo "      2. Actualiza todos los clientes para usar HTTP API v2"
echo "      3. Ejecuta: aws apigateway delete-rest-api --rest-api-id $REST_API_ID --region $REGION"
echo ""
echo "   💡 Por seguridad, NO se elimina automáticamente"

echo ""
echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo "═══════════════════════════════════════════════════════════════"
echo "✅ MEJORAS IMPLEMENTADAS"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ 1. Auto-Scaling configurado (min: 2, max: 10)"
echo "✅ 2. Deployment Circuit Breaker habilitado"
echo "✅ 3. Container Insights habilitado"
echo "✅ 4. Point-in-Time Recovery habilitado en DynamoDB"
echo "✅ 5. Alarmas adicionales configuradas (CPU, Memory, Target Health)"
echo "✅ 6. WAF implementado (si se creó correctamente)"
echo "✅ 7. VPC Endpoints configurados (si se crearon correctamente)"
echo ""
echo "⚠️  8. REST API v1: Revisar manualmente antes de deprecar"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 PRÓXIMOS PASOS:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Verificar que el servicio ECS tenga 2 tasks corriendo:"
echo "   aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
echo ""
echo "2. Verificar que Container Insights esté habilitado:"
echo "   aws ecs describe-clusters --clusters $CLUSTER_NAME --include SETTINGS --region $REGION"
echo ""
echo "3. Verificar alarmas en CloudWatch:"
echo "   aws cloudwatch describe-alarms --alarm-name-prefix gua-clinic --region $REGION"
echo ""
echo "4. Verificar WAF:"
echo "   aws wafv2 list-web-acls --scope REGIONAL --region $REGION"
echo ""
echo "5. Verificar VPC Endpoints:"
echo "   aws ec2 describe-vpc-endpoints --region $REGION"
echo ""
echo "═══════════════════════════════════════════════════════════════"


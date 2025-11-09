#!/bin/bash

# Script completo para verificar TODA la infraestructura AWS de GUA Clinic
# Este script verifica todos los servicios y configuraciones

set -e

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"
TASK_FAMILY="gua-clinic-api"

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 VERIFICACIÓN COMPLETA DE INFRAESTRUCTURA AWS - GUA CLINIC"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 1. ECS SERVICE CONFIGURATION
# ============================================================================
echo "📊 1. CONFIGURACIÓN DE ECS SERVICE"
echo "───────────────────────────────────────────────────────────────"

SERVICE_INFO=$(aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'services[0]' \
  --output json 2>/dev/null || echo '{}')

if [ "$SERVICE_INFO" != "{}" ]; then
  echo "✅ ECS Service encontrado"
  echo ""
  echo "📋 Detalles del servicio:"
  echo "$SERVICE_INFO" | jq '{
    status: .status,
    desiredCount: .desiredCount,
    runningCount: .runningCount,
    pendingCount: .pendingCount,
    launchType: .launchType,
    taskDefinition: .taskDefinition,
    platformVersion: .platformVersion,
    deploymentConfiguration: .deploymentConfiguration,
    networkConfiguration: .networkConfiguration,
    loadBalancers: .loadBalancers,
    serviceRegistries: .serviceRegistries
  }'
  
  DESIRED_COUNT=$(echo "$SERVICE_INFO" | jq -r '.desiredCount // 0')
  RUNNING_COUNT=$(echo "$SERVICE_INFO" | jq -r '.runningCount // 0')
  HAS_LOAD_BALANCER=$(echo "$SERVICE_INFO" | jq -r '.loadBalancers | length > 0')
  
  echo ""
  if [ "$DESIRED_COUNT" -eq 1 ]; then
    echo "⚠️  Desired Count: 1 (single point of failure)"
  else
    echo "✅ Desired Count: $DESIRED_COUNT (alta disponibilidad)"
  fi
  
  if [ "$HAS_LOAD_BALANCER" == "true" ]; then
    echo "✅ Load Balancer configurado"
    echo "$SERVICE_INFO" | jq -r '.loadBalancers[] | "   - Target Group ARN: \(.targetGroupArn)"'
  else
    echo "❌ Load Balancer NO configurado"
  fi
  
  # Verificar subnets (multi-AZ)
  SUBNETS=$(echo "$SERVICE_INFO" | jq -r '.networkConfiguration.awsvpcConfiguration.subnets[]?')
  if [ ! -z "$SUBNETS" ]; then
    echo ""
    echo "📍 Subnets configuradas:"
    for SUBNET in $SUBNETS; do
      AZ=$(aws ec2 describe-subnets \
        --subnet-ids "$SUBNET" \
        --region "$REGION" \
        --query 'Subnets[0].AvailabilityZone' \
        --output text 2>/dev/null || echo "unknown")
      echo "   - $SUBNET (AZ: $AZ)"
    done
  fi
else
  echo "❌ ECS Service no encontrado"
fi

echo ""
echo ""

# ============================================================================
# 2. AUTO-SCALING CONFIGURATION
# ============================================================================
echo "📈 2. CONFIGURACIÓN DE AUTO-SCALING"
echo "───────────────────────────────────────────────────────────────"

SCALABLE_TARGET=$(aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs \
  --resource-ids "service/$CLUSTER_NAME/$SERVICE_NAME" \
  --region "$REGION" \
  --output json 2>/dev/null || echo '{"ScalableTargets": []}')

SCALABLE_COUNT=$(echo "$SCALABLE_TARGET" | jq '.ScalableTargets | length')

if [ "$SCALABLE_COUNT" -gt 0 ]; then
  echo "✅ Auto-scaling configurado"
  echo "$SCALABLE_TARGET" | jq -r '.ScalableTargets[] | "   MinCapacity: \(.MinCapacity), MaxCapacity: \(.MaxCapacity), Status: \(.StatusCode)"'
  
  # Verificar políticas de scaling
  SCALING_POLICIES=$(aws application-autoscaling describe-scaling-policies \
    --service-namespace ecs \
    --resource-id "service/$CLUSTER_NAME/$SERVICE_NAME" \
    --region "$REGION" \
    --output json 2>/dev/null || echo '{"ScalingPolicies": []}')
  
  POLICY_COUNT=$(echo "$SCALING_POLICIES" | jq '.ScalingPolicies | length')
  if [ "$POLICY_COUNT" -gt 0 ]; then
    echo ""
    echo "✅ Políticas de scaling:"
    echo "$SCALING_POLICIES" | jq -r '.ScalingPolicies[] | "   - \(.PolicyName): \(.PolicyType)"'
  else
    echo "⚠️  No hay políticas de scaling configuradas"
  fi
else
  echo "❌ Auto-scaling NO configurado"
fi

echo ""
echo ""

# ============================================================================
# 3. LOAD BALANCER CONFIGURATION
# ============================================================================
echo "⚖️  3. CONFIGURACIÓN DE LOAD BALANCER"
echo "───────────────────────────────────────────────────────────────"

ALB_INFO=$(aws elbv2 describe-load-balancers \
  --region "$REGION" \
  --query "LoadBalancers[?contains(LoadBalancerName, 'gua-clinic')]" \
  --output json 2>/dev/null || echo '[]')

ALB_COUNT=$(echo "$ALB_INFO" | jq 'length')

if [ "$ALB_COUNT" -gt 0 ]; then
  echo "✅ Load Balancer(s) encontrado(s): $ALB_COUNT"
  echo "$ALB_INFO" | jq '.[] | {
    Name: .LoadBalancerName,
    DNSName: .DNSName,
    Type: .Type,
    Scheme: .Scheme,
    State: .State.Code,
    AvailabilityZones: .AvailabilityZones | length
  }'
  
  # Verificar Target Groups
  echo ""
  echo "🎯 Target Groups:"
  for ALB_ARN in $(echo "$ALB_INFO" | jq -r '.[].LoadBalancerArn'); do
    TG_INFO=$(aws elbv2 describe-target-groups \
      --load-balancer-arn "$ALB_ARN" \
      --region "$REGION" \
      --output json 2>/dev/null || echo '{"TargetGroups": []}')
    
    TG_COUNT=$(echo "$TG_INFO" | jq '.TargetGroups | length')
    if [ "$TG_COUNT" -gt 0 ]; then
      echo "$TG_INFO" | jq -r '.TargetGroups[] | "   - \(.TargetGroupName): Port \(.Port), Protocol \(.Protocol), HealthCheck: \(.HealthCheckPath), Interval: \(.HealthCheckIntervalSeconds)s"'
    else
      echo "   ⚠️  No se encontraron Target Groups para este ALB"
    fi
    
    # Verificar estado de targets
    for TG_ARN in $(echo "$TG_INFO" | jq -r '.TargetGroups[].TargetGroupArn'); do
      echo ""
      echo "   📊 Estado de Targets para $TG_ARN:"
      TARGET_HEALTH=$(aws elbv2 describe-target-health \
        --target-group-arn "$TG_ARN" \
        --region "$REGION" \
        --output json 2>/dev/null || echo '[]')
      
      HEALTHY_COUNT=$(echo "$TARGET_HEALTH" | jq '[.[] | select(.TargetHealth.State == "healthy")] | length')
      UNHEALTHY_COUNT=$(echo "$TARGET_HEALTH" | jq '[.[] | select(.TargetHealth.State != "healthy")] | length')
      
      echo "      ✅ Healthy: $HEALTHY_COUNT"
      echo "      ❌ Unhealthy: $UNHEALTHY_COUNT"
      
      if [ "$UNHEALTHY_COUNT" -gt 0 ]; then
        echo "      ⚠️  Targets no saludables:"
        echo "$TARGET_HEALTH" | jq -r '.[] | select(.TargetHealth.State != "healthy") | "         - \(.Target.Id): \(.TargetHealth.State) - \(.TargetHealth.Reason // "N/A")"'
      fi
    done
  done
else
  echo "❌ No se encontraron Load Balancers"
fi

echo ""
echo ""

# ============================================================================
# 4. API GATEWAY CONFIGURATION
# ============================================================================
echo "🚪 4. CONFIGURACIÓN DE API GATEWAY"
echo "───────────────────────────────────────────────────────────────"

# REST APIs
REST_APIS=$(aws apigateway get-rest-apis \
  --region "$REGION" \
  --query "items[?contains(name, 'gua-clinic') || contains(name, 'gua')]" \
  --output json 2>/dev/null || echo '[]')

REST_COUNT=$(echo "$REST_APIS" | jq 'length')

if [ "$REST_COUNT" -gt 0 ]; then
  echo "✅ REST API(s) encontrada(s): $REST_COUNT"
  echo "$REST_APIS" | jq '.[] | {
    Name: .name,
    Id: .id,
    CreatedDate: .createdDate
  }'
fi

# HTTP APIs v2
HTTP_APIS=$(aws apigatewayv2 get-apis \
  --region "$REGION" \
  --query "Items[?contains(Name, 'gua-clinic') || contains(Name, 'gua')]" \
  --output json 2>/dev/null || echo '[]')

HTTP_COUNT=$(echo "$HTTP_APIS" | jq 'length')

if [ "$HTTP_COUNT" -gt 0 ]; then
  echo ""
  echo "✅ HTTP API(s) v2 encontrada(s): $HTTP_COUNT"
  echo "$HTTP_APIS" | jq '.[] | {
    Name: .Name,
    ApiId: .ApiId,
    ProtocolType: .ProtocolType,
    CreatedDate: .CreatedDate
  }'
fi

if [ "$REST_COUNT" -eq 0 ] && [ "$HTTP_COUNT" -eq 0 ]; then
  echo "❌ No se encontraron API Gateways"
fi

echo ""
echo ""

# ============================================================================
# 5. CLOUDWATCH ALARMS
# ============================================================================
echo "🚨 5. CLOUDWATCH ALARMS"
echo "───────────────────────────────────────────────────────────────"

ALARMS=$(aws cloudwatch describe-alarms \
  --alarm-name-prefix "gua-clinic" \
  --region "$REGION" \
  --output json 2>/dev/null || echo '{"MetricAlarms": [], "CompositeAlarms": []}')

ALARM_COUNT=$(echo "$ALARMS" | jq '.MetricAlarms | length')

if [ "$ALARM_COUNT" -gt 0 ]; then
  echo "✅ Alarmas encontradas: $ALARM_COUNT"
  echo "$ALARMS" | jq '.MetricAlarms[] | {
    AlarmName: .AlarmName,
    StateValue: .StateValue,
    MetricName: .MetricName,
    Namespace: .Namespace,
    ComparisonOperator: .ComparisonOperator,
    Threshold: .Threshold,
    EvaluationPeriods: .EvaluationPeriods
  }'
else
  echo "❌ No se encontraron alarmas con prefijo 'gua-clinic'"
  echo "   (Buscando todas las alarmas relacionadas con ECS...)"
  
  # Buscar alarmas relacionadas con ECS
  ALL_ALARMS=$(aws cloudwatch describe-alarms \
    --region "$REGION" \
    --output json 2>/dev/null || echo '{"MetricAlarms": []}')
  
  ECS_ALARMS=$(echo "$ALL_ALARMS" | jq "[.MetricAlarms[]? | select(.Namespace | contains(\"ECS\") or contains(\"AWS/ECS\") or . == null) | select(.AlarmName | contains(\"$CLUSTER_NAME\") or contains(\"$SERVICE_NAME\") or . == null))]")
  
  ECS_ALARM_COUNT=$(echo "$ECS_ALARMS" | jq 'length')
  if [ "$ECS_ALARM_COUNT" -gt 0 ]; then
    echo "   ✅ Encontradas $ECS_ALARM_COUNT alarmas relacionadas con ECS:"
    echo "$ECS_ALARMS" | jq '.MetricAlarms[] | {
      AlarmName: .AlarmName,
      StateValue: .StateValue,
      MetricName: .MetricName
    }'
  else
    echo "   ❌ No se encontraron alarmas relacionadas con ECS"
  fi
fi

echo ""
echo ""

# ============================================================================
# 6. CLOUDWATCH DASHBOARDS
# ============================================================================
echo "📊 6. CLOUDWATCH DASHBOARDS"
echo "───────────────────────────────────────────────────────────────"

DASHBOARDS=$(aws cloudwatch list-dashboards \
  --region "$REGION" \
  --query "DashboardEntries[?contains(DashboardName, 'gua-clinic') || contains(DashboardName, 'GUA') || contains(DashboardName, 'gua')]" \
  --output json 2>/dev/null || echo '[]')

DASHBOARD_COUNT=$(echo "$DASHBOARDS" | jq 'length')

if [ "$DASHBOARD_COUNT" -gt 0 ]; then
  echo "✅ Dashboards encontrados: $DASHBOARD_COUNT"
  echo "$DASHBOARDS" | jq '.[] | {
    DashboardName: .DashboardName,
    LastModified: .LastModified
  }'
else
  echo "❌ No se encontraron dashboards"
fi

echo ""
echo ""

# ============================================================================
# 7. CONTAINER INSIGHTS
# ============================================================================
echo "🔍 7. CONTAINER INSIGHTS"
echo "───────────────────────────────────────────────────────────────"

CLUSTER_SETTINGS=$(aws ecs describe-clusters \
  --clusters "$CLUSTER_NAME" \
  --include SETTINGS \
  --region "$REGION" \
  --output json 2>/dev/null || echo '{}')

CONTAINER_INSIGHTS=$(echo "$CLUSTER_SETTINGS" | jq -r '.clusters[0].settings[]? | select(.name == "containerInsights") | .value // "disabled"')

if [ "$CONTAINER_INSIGHTS" == "enabled" ]; then
  echo "✅ Container Insights habilitado"
else
  echo "❌ Container Insights NO habilitado"
fi

echo ""
echo ""

# ============================================================================
# 8. DYNAMODB TABLES
# ============================================================================
echo "💾 8. DYNAMODB TABLES"
echo "───────────────────────────────────────────────────────────────"

DYNAMO_TABLES=$(aws dynamodb list-tables \
  --region "$REGION" \
  --query "TableNames[?contains(@, 'gua-clinic')]" \
  --output json 2>/dev/null || echo '[]')

TABLE_COUNT=$(echo "$DYNAMO_TABLES" | jq 'length')

if [ "$TABLE_COUNT" -gt 0 ]; then
  echo "✅ Tablas DynamoDB encontradas: $TABLE_COUNT"
  for TABLE in $(echo "$DYNAMO_TABLES" | jq -r '.[]'); do
    TABLE_INFO=$(aws dynamodb describe-table \
      --table-name "$TABLE" \
      --region "$REGION" \
      --output json 2>/dev/null || echo '{}')
    
    echo ""
    echo "   📋 Tabla: $TABLE"
    echo "$TABLE_INFO" | jq '{
      TableStatus: .TableStatus,
      ItemCount: .ItemCount,
      TableSizeBytes: .TableSizeBytes,
      BillingMode: .BillingModeSummary.BillingMode,
      PointInTimeRecovery: .ContinuousBackupsDescription.PointInTimeRecoveryStatus
    }'
  done
else
  echo "❌ No se encontraron tablas DynamoDB"
fi

echo ""
echo ""

# ============================================================================
# 9. SECRETS MANAGER
# ============================================================================
echo "🔐 9. SECRETS MANAGER"
echo "───────────────────────────────────────────────────────────────"

SECRETS=$(aws secretsmanager list-secrets \
  --region "$REGION" \
  --query "SecretList[?contains(Name, 'gua-clinic') || contains(Name, 'dricloud')]" \
  --output json 2>/dev/null || echo '[]')

SECRET_COUNT=$(echo "$SECRETS" | jq 'length')

if [ "$SECRET_COUNT" -gt 0 ]; then
  echo "✅ Secrets encontrados: $SECRET_COUNT"
  echo "$SECRETS" | jq '.[] | {
    Name: .Name,
    Description: .Description,
    LastChangedDate: .LastChangedDate,
    RotationEnabled: .RotationEnabled
  }'
else
  echo "❌ No se encontraron secrets"
fi

echo ""
echo ""

# ============================================================================
# 10. WAF (Web Application Firewall)
# ============================================================================
echo "🛡️  10. WAF (Web Application Firewall)"
echo "───────────────────────────────────────────────────────────────"

WAF_WEB_ACLS=$(aws wafv2 list-web-acls \
  --scope REGIONAL \
  --region "$REGION" \
  --query "WebACLs[?contains(Name, 'gua-clinic') || contains(Name, 'gua')]" \
  --output json 2>/dev/null || echo '[]')

WAF_COUNT=$(echo "$WAF_WEB_ACLS" | jq 'length')

if [ "$WAF_COUNT" -gt 0 ]; then
  echo "✅ WAF Web ACLs encontrados: $WAF_COUNT"
  echo "$WAF_WEB_ACLS" | jq '.[] | {
    Name: .Name,
    Id: .Id,
    ARN: .ARN,
    Description: .Description
  }'
  
  # Verificar asociaciones con ALB
  echo ""
  echo "   🔗 Asociaciones con recursos:"
  for WAF_ARN in $(echo "$WAF_WEB_ACLS" | jq -r '.[].ARN'); do
    WAF_RESOURCES=$(aws wafv2 list-resources-for-web-acl \
      --web-acl-arn "$WAF_ARN" \
      --region "$REGION" \
      --output json 2>/dev/null || echo '{"ResourceArns": []}')
    
    RESOURCE_COUNT=$(echo "$WAF_RESOURCES" | jq '.ResourceArns | length')
    if [ "$RESOURCE_COUNT" -gt 0 ]; then
      echo "      ✅ WAF asociado con $RESOURCE_COUNT recurso(s)"
      echo "$WAF_RESOURCES" | jq -r '.ResourceArns[] | "         - \(.)"'
    else
      echo "      ⚠️  WAF no asociado con ningún recurso"
    fi
  done
else
  echo "❌ WAF NO configurado"
fi

echo ""
echo ""

# ============================================================================
# 11. ECR REPOSITORY
# ============================================================================
echo "🐳 11. ECR REPOSITORY"
echo "───────────────────────────────────────────────────────────────"

ECR_REPOS=$(aws ecr describe-repositories \
  --region "$REGION" \
  --query "repositories[?contains(repositoryName, 'gua-clinic')]" \
  --output json 2>/dev/null || echo '[]')

ECR_COUNT=$(echo "$ECR_REPOS" | jq 'length')

if [ "$ECR_COUNT" -gt 0 ]; then
  echo "✅ Repositorios ECR encontrados: $ECR_COUNT"
  echo "$ECR_REPOS" | jq '.[] | {
    RepositoryName: .repositoryName,
    RepositoryUri: .repositoryUri,
    ImageScanningConfiguration: .imageScanningConfiguration,
    ImageTagMutability: .imageTagMutability,
    CreatedAt: .createdAt
  }'
else
  echo "❌ No se encontraron repositorios ECR"
fi

echo ""
echo ""

# ============================================================================
# 12. VPC ENDPOINTS
# ============================================================================
echo "🔌 12. VPC ENDPOINTS"
echo "───────────────────────────────────────────────────────────────"

VPC_ENDPOINTS=$(aws ec2 describe-vpc-endpoints \
  --region "$REGION" \
  --filters "Name=service-name,Values=com.amazonaws.eu-north-1.dynamodb,com.amazonaws.eu-north-1.secretsmanager" \
  --output json 2>/dev/null || echo '{"VpcEndpoints": []}')

ENDPOINT_COUNT=$(echo "$VPC_ENDPOINTS" | jq '.VpcEndpoints | length')

if [ "$ENDPOINT_COUNT" -gt 0 ]; then
  echo "✅ VPC Endpoints encontrados: $ENDPOINT_COUNT"
  echo "$VPC_ENDPOINTS" | jq '.VpcEndpoints[] | {
    VpcEndpointId: .VpcEndpointId,
    ServiceName: .ServiceName,
    VpcEndpointType: .VpcEndpointType,
    State: .State,
    VpcId: .VpcId
  }'
else
  echo "❌ VPC Endpoints NO configurados"
fi

echo ""
echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
echo "═══════════════════════════════════════════════════════════════"
echo "📋 RESUMEN DE VERIFICACIÓN"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "✅ Servicios Configurados:"
[ "$SERVICE_INFO" != "{}" ] && echo "   ✅ ECS Service"
[ "$ALB_COUNT" -gt 0 ] && echo "   ✅ Application Load Balancer"
[ "$REST_COUNT" -gt 0 ] || [ "$HTTP_COUNT" -gt 0 ] && echo "   ✅ API Gateway"
[ "$TABLE_COUNT" -gt 0 ] && echo "   ✅ DynamoDB"
[ "$SECRET_COUNT" -gt 0 ] && echo "   ✅ Secrets Manager"
[ "$ECR_COUNT" -gt 0 ] && echo "   ✅ ECR"

echo ""
echo "⚠️  Áreas que Necesitan Atención:"
[ "$SCALABLE_COUNT" -eq 0 ] && echo "   ⚠️  Auto-scaling NO configurado"
[ "$ALARM_COUNT" -eq 0 ] && [ "$ECS_ALARM_COUNT" -eq 0 ] && echo "   ⚠️  CloudWatch Alarms NO configuradas"
[ "$DASHBOARD_COUNT" -eq 0 ] && echo "   ⚠️  CloudWatch Dashboards NO configurados"
[ "$CONTAINER_INSIGHTS" != "enabled" ] && echo "   ⚠️  Container Insights NO habilitado"
[ "$WAF_COUNT" -eq 0 ] && echo "   ⚠️  WAF NO configurado"
[ "$ENDPOINT_COUNT" -eq 0 ] && echo "   ⚠️  VPC Endpoints NO configurados"
[ "$DESIRED_COUNT" -eq 1 ] && echo "   ⚠️  Desired Count = 1 (single point of failure)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Verificación completada"
echo "═══════════════════════════════════════════════════════════════"


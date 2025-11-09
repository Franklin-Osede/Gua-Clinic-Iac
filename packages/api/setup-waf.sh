#!/bin/bash

# Script para configurar WAF desde CLI

set -e

REGION="eu-north-1"
ALB_NAME="gua-clinic-api-alb"
WAF_NAME="gua-clinic-waf"

echo "═══════════════════════════════════════════════════════════════"
echo "🛡️  CONFIGURANDO WAF DESDE CLI - GUA CLINIC"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Obtener ARN del ALB
echo "📋 1. Obteniendo ARN del ALB..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names "$ALB_NAME" \
  --region "$REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$ALB_ARN" ] || [ "$ALB_ARN" == "None" ]; then
  echo "   ❌ Error: No se pudo obtener ARN del ALB"
  exit 1
fi

echo "   ✅ ALB ARN: $ALB_ARN"
echo ""

# Verificar si ya existe un Web ACL
echo "📋 2. Verificando si ya existe un Web ACL..."
EXISTING_WAF=$(aws wafv2 list-web-acls \
  --scope REGIONAL \
  --region "$REGION" \
  --query "WebACLs[?Name=='$WAF_NAME'].{Name:Name,Id:Id,ARN:ARN}" \
  --output json 2>/dev/null || echo "[]")

if [ "$EXISTING_WAF" != "[]" ] && [ ! -z "$EXISTING_WAF" ]; then
  echo "   ⚠️  Ya existe un Web ACL con el nombre '$WAF_NAME'"
  WAF_ID=$(echo "$EXISTING_WAF" | jq -r '.[0].Id' 2>/dev/null || echo "")
  WAF_ARN=$(echo "$EXISTING_WAF" | jq -r '.[0].ARN' 2>/dev/null || echo "")
  echo "   📝 ID: $WAF_ID"
  echo "   📝 ARN: $WAF_ARN"
else
  echo "   ✅ No existe Web ACL con ese nombre, procediendo a crear..."
  echo ""
  
  # Crear Web ACL
  echo "📋 3. Creando Web ACL..."
  
  # Crear el Web ACL con reglas desde archivo JSON
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  RULES_FILE="$SCRIPT_DIR/waf-rules.json"
  
  if [ ! -f "$RULES_FILE" ]; then
    echo "   ❌ Error: No se encontró el archivo de reglas: $RULES_FILE"
    exit 1
  fi
  
  WAF_RESPONSE=$(aws wafv2 create-web-acl \
    --scope REGIONAL \
    --default-action Allow={} \
    --name "$WAF_NAME" \
    --description "WAF para GUA Clinic API - Protección contra OWASP Top 10 y rate limiting" \
    --rules file://"$RULES_FILE" \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=GuaClinicWAF \
    --region "$REGION" 2>&1)
  
  if [ $? -eq 0 ]; then
    WAF_ARN=$(echo "$WAF_RESPONSE" | jq -r '.Summary.ARN' 2>/dev/null || echo "")
    WAF_ID=$(echo "$WAF_RESPONSE" | jq -r '.Summary.Id' 2>/dev/null || echo "")
    
    if [ ! -z "$WAF_ARN" ] && [ "$WAF_ARN" != "null" ]; then
      echo "   ✅ Web ACL creado exitosamente"
      echo "   📝 ID: $WAF_ID"
      echo "   📝 ARN: $WAF_ARN"
    else
      echo "   ❌ Error: No se pudo obtener ARN del Web ACL creado"
      echo "   📝 Respuesta: $WAF_RESPONSE"
      exit 1
    fi
  else
    echo "   ❌ Error al crear Web ACL"
    echo "   📝 Error: $WAF_RESPONSE"
    exit 1
  fi
fi

echo ""

# Asociar WAF con ALB
echo "📋 4. Asociando Web ACL con ALB..."
ASSOCIATION_RESPONSE=$(aws wafv2 associate-web-acl \
  --web-acl-arn "$WAF_ARN" \
  --resource-arn "$ALB_ARN" \
  --region "$REGION" 2>&1)

if [ $? -eq 0 ]; then
  echo "   ✅ Web ACL asociado exitosamente con ALB"
else
  # Verificar si ya está asociado
  if echo "$ASSOCIATION_RESPONSE" | grep -qi "already associated\|WAFInvalidOperationException"; then
    echo "   ⚠️  El Web ACL ya está asociado al ALB (o hay un conflicto)"
    echo "   📝 Verificando asociación actual..."
    
    CURRENT_WAF=$(aws wafv2 get-web-acl-for-resource \
      --resource-arn "$ALB_ARN" \
      --region "$REGION" 2>/dev/null || echo "")
    
    if [ ! -z "$CURRENT_WAF" ] && [ "$CURRENT_WAF" != "null" ]; then
      CURRENT_WAF_ARN=$(echo "$CURRENT_WAF" | jq -r '.WebACL.ARN' 2>/dev/null || echo "")
      if [ "$CURRENT_WAF_ARN" == "$WAF_ARN" ]; then
        echo "   ✅ El Web ACL correcto ya está asociado"
      else
        echo "   ⚠️  Hay otro Web ACL asociado: $CURRENT_WAF_ARN"
        echo "   💡 Puedes desasociarlo y asociar el nuevo si es necesario"
      fi
    fi
  else
    echo "   ❌ Error al asociar Web ACL"
    echo "   📝 Error: $ASSOCIATION_RESPONSE"
    exit 1
  fi
fi

echo ""

# Verificar configuración final
echo "📋 5. Verificando configuración final..."
VERIFICATION=$(aws wafv2 get-web-acl-for-resource \
  --resource-arn "$ALB_ARN" \
  --region "$REGION" 2>/dev/null || echo "")

if [ ! -z "$VERIFICATION" ] && [ "$VERIFICATION" != "null" ]; then
  VERIFIED_WAF_ARN=$(echo "$VERIFICATION" | jq -r '.WebACL.ARN' 2>/dev/null || echo "")
  VERIFIED_WAF_NAME=$(echo "$VERIFICATION" | jq -r '.WebACL.Name' 2>/dev/null || echo "")
  
  if [ "$VERIFIED_WAF_ARN" == "$WAF_ARN" ]; then
    echo "   ✅ Verificación exitosa"
    echo "   📝 Web ACL asociado: $VERIFIED_WAF_NAME"
    echo "   📝 ARN: $VERIFIED_WAF_ARN"
  else
    echo "   ⚠️  El Web ACL asociado es diferente al esperado"
  fi
else
  echo "   ⚠️  No se pudo verificar la asociación"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Resumen:"
echo "   ✅ Web ACL: $WAF_NAME"
echo "   ✅ ARN: $WAF_ARN"
echo "   ✅ Asociado a: $ALB_NAME"
echo ""
echo "📝 Reglas configuradas:"
echo "   1. AWSManagedRulesCommonRuleSet (OWASP Top 10)"
echo "   2. AWSManagedRulesKnownBadInputsRuleSet (Inputs maliciosos)"
echo "   3. RateLimitRule (2000 requests/IP)"
echo ""
echo "🔍 Para verificar en AWS Console:"
echo "   https://console.aws.amazon.com/wafv2/home?region=$REGION#/webacls"
echo ""
echo "📊 Para ver métricas en CloudWatch:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$REGION#metricsV2:graph=~();namespace=AWS/WAFV2"
echo ""
echo "═══════════════════════════════════════════════════════════════"


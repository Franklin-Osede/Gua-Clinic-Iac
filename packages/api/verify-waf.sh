#!/bin/bash

# Script para verificar configuración de WAF

set -e

REGION="eu-north-1"
ALB_NAME="gua-clinic-api-alb"

echo "═══════════════════════════════════════════════════════════════"
echo "🛡️  VERIFICACIÓN DE WAF - GUA CLINIC"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Obtener ARN del ALB
echo "📋 1. Obteniendo información del ALB..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names "$ALB_NAME" \
  --region "$REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$ALB_ARN" ] || [ "$ALB_ARN" == "None" ]; then
  echo "   ❌ No se pudo obtener ARN del ALB"
  exit 1
fi

echo "   ✅ ALB ARN: $ALB_ARN"
echo ""

# Verificar Web ACLs asociados al ALB
echo "📋 2. Verificando Web ACLs asociados al ALB..."
WAF_ASSOCIATION=$(aws wafv2 get-web-acl-for-resource \
  --resource-arn "$ALB_ARN" \
  --region "$REGION" 2>/dev/null || echo "")

if [ ! -z "$WAF_ASSOCIATION" ] && [ "$WAF_ASSOCIATION" != "null" ]; then
  echo "   ✅ WAF está asociado al ALB"
  echo "$WAF_ASSOCIATION" | jq '.' 2>/dev/null || echo "$WAF_ASSOCIATION"
else
  echo "   ❌ No se encontró WAF asociado al ALB"
fi

echo ""

# Listar todos los Web ACLs en la región
echo "📋 3. Listando todos los Web ACLs en la región..."
WEB_ACLS=$(aws wafv2 list-web-acls \
  --scope REGIONAL \
  --region "$REGION" \
  --query 'WebACLs[*].{Name:Name,Id:Id,ARN:ARN}' \
  --output json 2>/dev/null || echo "[]")

if [ "$WEB_ACLS" != "[]" ] && [ ! -z "$WEB_ACLS" ]; then
  echo "   📝 Web ACLs encontrados:"
  echo "$WEB_ACLS" | jq '.' 2>/dev/null || echo "$WEB_ACLS"
  
  # Verificar si alguno contiene "gua" en el nombre
  if echo "$WEB_ACLS" | grep -qi "gua"; then
    echo ""
    echo "   ✅ Se encontró un Web ACL relacionado con GUA Clinic"
  fi
else
  echo "   ⚠️  No se encontraron Web ACLs en la región"
fi

echo ""

# Verificar reglas de WAF si existe
echo "📋 4. Verificando reglas de WAF..."
if [ ! -z "$WAF_ASSOCIATION" ] && [ "$WAF_ASSOCIATION" != "null" ]; then
  WEB_ACL_ARN=$(echo "$WAF_ASSOCIATION" | jq -r '.WebACL.ARN' 2>/dev/null || echo "")
  if [ ! -z "$WEB_ACL_ARN" ] && [ "$WEB_ACL_ARN" != "null" ]; then
    WEB_ACL_ID=$(echo "$WEB_ACL_ARN" | awk -F'/' '{print $NF}')
    WEB_ACL_NAME=$(echo "$WEB_ACL_ARN" | awk -F'/' '{print $(NF-1)}')
    
    echo "   📝 Obteniendo detalles del Web ACL: $WEB_ACL_NAME"
    WEB_ACL_DETAILS=$(aws wafv2 get-web-acl \
      --scope REGIONAL \
      --id "$WEB_ACL_ID" \
      --name "$WEB_ACL_NAME" \
      --region "$REGION" 2>/dev/null || echo "")
    
    if [ ! -z "$WEB_ACL_DETAILS" ]; then
      echo "   ✅ Detalles del Web ACL:"
      echo "$WEB_ACL_DETAILS" | jq '.WebACL | {Name,Id,DefaultAction,Rules: .Rules | length}' 2>/dev/null || echo "$WEB_ACL_DETAILS"
    fi
  fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 RESUMEN"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ ! -z "$WAF_ASSOCIATION" ] && [ "$WAF_ASSOCIATION" != "null" ]; then
  echo "✅ WAF está configurado y asociado al ALB"
  echo ""
  echo "📝 Para ver más detalles en AWS Console:"
  echo "   1. Ve a: https://console.aws.amazon.com/wafv2/home?region=$REGION#/webacls"
  echo "   2. Busca el Web ACL asociado a tu ALB"
  echo "   3. Revisa las reglas y métricas"
else
  echo "❌ WAF NO está configurado o NO está asociado al ALB"
  echo ""
  echo "📝 Para configurar WAF manualmente:"
  echo "   1. Ve a: https://console.aws.amazon.com/wafv2/home?region=$REGION#/webacls"
  echo "   2. Crea un nuevo Web ACL (REGIONAL scope)"
  echo "   3. Agrega reglas recomendadas:"
  echo "      - AWSManagedRulesCommonRuleSet"
  echo "      - Rate limiting (2000 requests/IP)"
  echo "   4. Asocia el Web ACL a tu ALB: $ALB_NAME"
  echo ""
  echo "💡 O ejecuta el script: implement-infrastructure-improvements.sh"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"


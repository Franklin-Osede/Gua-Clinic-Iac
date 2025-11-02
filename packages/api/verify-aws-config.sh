#!/bin/bash

# Script para verificar la configuración de AWS
# Ejecuta este script para verificar que todos los recursos estén correctamente configurados

echo "🔍 Verificando configuración de AWS para GUA Clinic..."
echo ""

# Regiones a verificar (el código usa eu-north-1, pero verificamos ambas por si acaso)
REGIONS=("eu-north-1" "eu-west-1")

# Recursos esperados
SECRETS=(
  "gua-clinic/dricloud/credentials"
  "gua-clinic/app/config"
  "gua-clinic/monitoring/cloudwatch"
)

TABLES=(
  "gua-clinic-audit"
  "gua-clinic-cache"
)

echo "📋 RESUMEN DE CONFIGURACIÓN ESPERADA:"
echo "======================================"
echo "Región en el código: eu-north-1"
echo "Secretos esperados: ${#SECRETS[@]}"
echo "Tablas DynamoDB esperadas: ${#TABLES[@]}"
echo ""

# Función para verificar en una región
check_region() {
  local REGION=$1
  echo "📍 Verificando región: $REGION"
  echo "-----------------------------------"
  
  local FOUND_RESOURCES=0
  local TOTAL_RESOURCES=$((${#SECRETS[@]} + ${#TABLES[@]} + 1)) # +1 para SNS
  
  # Verificar Secrets Manager
  echo ""
  echo "🔐 Secrets Manager:"
  for SECRET in "${SECRETS[@]}"; do
    if aws secretsmanager describe-secret --secret-id "$SECRET" --region "$REGION" > /dev/null 2>&1; then
      echo "  ✅ $SECRET"
      ((FOUND_RESOURCES++))
    else
      echo "  ❌ $SECRET NO encontrado"
    fi
  done
  
  # Verificar DynamoDB
  echo ""
  echo "🗄️  DynamoDB Tables:"
  for TABLE in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" > /dev/null 2>&1; then
      TABLE_STATUS=$(aws dynamodb describe-table --table-name "$TABLE" --region "$REGION" --query 'Table.TableStatus' --output text 2>/dev/null)
      echo "  ✅ $TABLE (Estado: $TABLE_STATUS)"
      ((FOUND_RESOURCES++))
    else
      echo "  ❌ $TABLE NO encontrada"
    fi
  done
  
  # Verificar SNS Topic
  echo ""
  echo "📢 SNS Topic:"
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$REGION" 2>/dev/null)
  SNS_TOPIC_ARN="arn:aws:sns:${REGION}:${ACCOUNT_ID}:gua-clinic-dricloud-alerts"
  
  if aws sns get-topic-attributes --topic-arn "$SNS_TOPIC_ARN" --region "$REGION" > /dev/null 2>&1; then
    echo "  ✅ $SNS_TOPIC_ARN"
    ((FOUND_RESOURCES++))
  else
    echo "  ⚠️  $SNS_TOPIC_ARN NO encontrado (opcional, pero recomendado)"
  fi
  
  echo ""
  echo "📊 Recursos encontrados en $REGION: $FOUND_RESOURCES/$TOTAL_RESOURCES"
  
  return $FOUND_RESOURCES
}

# Verificar en ambas regiones
BEST_REGION=""
BEST_COUNT=0

for REGION in "${REGIONS[@]}"; do
  echo ""
  check_region "$REGION"
  COUNT=$?
  
  if [ $COUNT -gt $BEST_COUNT ]; then
    BEST_COUNT=$COUNT
    BEST_REGION=$REGION
  fi
  
  echo ""
done

# Resumen final
echo ""
echo "═══════════════════════════════════════"
echo "📋 RESUMEN FINAL"
echo "═══════════════════════════════════════"
echo ""

if [ "$BEST_REGION" = "eu-north-1" ] && [ $BEST_COUNT -ge 4 ]; then
  echo "✅ TODO CORRECTO: Los recursos están en eu-north-1 (coincide con el código)"
elif [ "$BEST_REGION" = "eu-west-1" ] && [ $BEST_COUNT -ge 4 ]; then
  echo "⚠️  ATENCIÓN: Los recursos están en eu-west-1 pero el código busca en eu-north-1"
  echo "   Opciones:"
  echo "   1. Mover recursos a eu-north-1, O"
  echo "   2. Cambiar el código para usar eu-west-1"
else
  echo "❌ PROBLEMA: Faltan recursos o están en otra región"
  echo "   Mejor región encontrada: $BEST_REGION ($BEST_COUNT recursos)"
fi

echo ""
echo "💡 Verificación completada"
echo ""


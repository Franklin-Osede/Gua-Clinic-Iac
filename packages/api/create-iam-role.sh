#!/bin/bash

# Script para crear el IAM Role necesario para ECS
# Ejecuta este script ANTES de deploy-ecs.sh

echo "🔐 Creando IAM Role para ECS Tasks..."
echo ""

REGION="eu-north-1"
ROLE_NAME="ecsTaskExecutionRole"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 1. Crear Trust Policy para ECS
echo "1️⃣ Creando Trust Policy..."
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# 2. Crear Role
echo "2️⃣ Creando IAM Role..."
if aws iam get-role --role-name "$ROLE_NAME" > /dev/null 2>&1; then
  echo "   ✅ Role ya existe, actualizando políticas..."
else
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document file:///tmp/trust-policy.json
  echo "   ✅ Role creado"
fi

# 3. Attach políticas base de ECS
echo "3️⃣ Adjuntando políticas base de ECS..."
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" \
  2>/dev/null || echo "   ⚠️  Política ya adjunta"

# 4. Crear política personalizada para Secrets y DynamoDB
echo "4️⃣ Creando política personalizada..."
POLICY_NAME="GuaClinicECSPolicy"

cat > /tmp/custom-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:gua-clinic/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/gua-clinic-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DescribeAlarms"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/ecs/*"
    }
  ]
}
EOF

# Verificar si la política ya existe
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

if aws iam get-policy --policy-arn "$POLICY_ARN" > /dev/null 2>&1; then
  echo "   ✅ Política ya existe, actualizando versión..."
  # Crear nueva versión de política
  aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document file:///tmp/custom-policy.json \
    --set-as-default 2>/dev/null || echo "   ⚠️  Versión actualizada o ya existe"
else
  aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file:///tmp/custom-policy.json
  echo "   ✅ Política creada"
fi

# Adjuntar política al role
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "$POLICY_ARN" 2>/dev/null || echo "   ⚠️  Política ya adjunta"

echo ""
echo "✅ IAM Role configurado: $ROLE_NAME"
echo ""
echo "📋 Permisos configurados:"
echo "   ✅ Secrets Manager (gua-clinic/*)"
echo "   ✅ DynamoDB (gua-clinic-*)"
echo "   ✅ CloudWatch (métricas y logs)"
echo ""
echo "🎉 Listo para desplegar con deploy-ecs.sh"


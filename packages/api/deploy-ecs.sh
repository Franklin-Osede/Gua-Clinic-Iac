#!/bin/bash

# Script completo para desplegar API en ECS Fargate (sin Load Balancer)
# Costo: ~$18/mes
# Tiempo estimado: 10-15 minutos

set -e

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"
TASK_FAMILY="gua-clinic-api"
REPO_NAME="gua-clinic-api"
IMAGE_TAG="latest"

echo "🚀 Desplegando GUA Clinic API en ECS Fargate..."
echo "💰 Costo estimado: ~$18/mes"
echo ""

# Obtener Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📊 Account ID: $ACCOUNT_ID"
echo "📍 Región: $REGION"
echo ""

# ============================================
# 1. CREAR ECR REPOSITORY
# ============================================
echo "1️⃣ Creando ECR Repository..."
REPO_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPO_NAME}"

if aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" > /dev/null 2>&1; then
  echo "   ✅ Repository ya existe"
else
  aws ecr create-repository \
    --repository-name "$REPO_NAME" \
    --region "$REGION" \
    --image-scanning-configuration scanOnPush=true
  echo "   ✅ Repository creado"
fi

# ============================================
# 2. BUILD Y PUSH DE IMAGEN DOCKER
# ============================================
echo ""
echo "2️⃣ Build y push de imagen Docker..."

# Login a ECR
echo "   🔐 Haciendo login en ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$REPO_URI"

# Build (desde el root del monorepo)
cd "$(dirname "$0")/../.."
echo "   🏗️  Construyendo imagen para linux/amd64 (compatible con ECS Fargate)..."
docker build --platform linux/amd64 -t "$REPO_NAME:$IMAGE_TAG" -f packages/api/Dockerfile .

# Tag y push
echo "   📤 Subiendo imagen a ECR..."
docker tag "$REPO_NAME:$IMAGE_TAG" "$REPO_URI:$IMAGE_TAG"
docker push "$REPO_URI:$IMAGE_TAG"

echo "   ✅ Imagen subida: $REPO_URI:$IMAGE_TAG"

# ============================================
# 3. CREAR IAM ROLES (si no existen)
# ============================================
echo ""
echo "3️⃣ Configurando IAM Roles..."

TASK_EXEC_ROLE_NAME="ecsTaskExecutionRole"
TASK_ROLE_NAME="ecsTaskRole"

# Verificar/Crear Execution Role
if aws iam get-role --role-name "$TASK_EXEC_ROLE_NAME" > /dev/null 2>&1; then
  echo "   ✅ Execution Role ya existe"
else
  echo "   ⚠️  Necesitas crear el IAM Role: $TASK_EXEC_ROLE_NAME"
  echo "   Ve a: AWS Console → IAM → Roles → Create Role"
  echo "   Selecciona: AWS service → ECS → ECS Task"
  echo "   Permisos necesarios:"
  echo "     - AmazonECSTaskExecutionRolePolicy"
  echo "     - Secrets Manager: GetSecretValue"
  echo "     - DynamoDB: PutItem, GetItem, Scan"
  exit 1
fi

TASK_EXEC_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${TASK_EXEC_ROLE_NAME}"
TASK_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${TASK_EXEC_ROLE_NAME}"

# ============================================
# 4. CREAR ECS CLUSTER
# ============================================
echo ""
echo "4️⃣ Creando ECS Cluster..."
if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$REGION" --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
  echo "   ✅ Cluster ya existe"
else
  aws ecs create-cluster \
    --cluster-name "$CLUSTER_NAME" \
    --region "$REGION"
  echo "   ✅ Cluster creado"
fi

# ============================================
# 5. CONFIGURAR RED (VPC, Subnets, Security Group)
# ============================================
echo ""
echo "5️⃣ Configurando red..."

# Obtener VPC por defecto
VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" \
  --filters "Name=is-default,Values=true" \
  --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
  echo "   ⚠️  No se encontró VPC por defecto"
  VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" \
    --query 'Vpcs[0].VpcId' --output text)
fi

echo "   📍 VPC ID: $VPC_ID"

# Obtener subnets públicas
SUBNET_IDS=$(aws ec2 describe-subnets --region "$REGION" \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[0:2].SubnetId' --output text)

SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')

echo "   📍 Subnets: $SUBNET_1, $SUBNET_2"

# Crear Security Group
SG_NAME="gua-clinic-api-sg"
SG_ID=$(aws ec2 describe-security-groups \
  --region "$REGION" \
  --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")

if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
  echo "   🔒 Creando Security Group..."
  SG_ID=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "Security group for GUA Clinic API" \
    --vpc-id "$VPC_ID" \
    --region "$REGION" \
    --query 'GroupId' --output text)
  
  # Permitir tráfico HTTP en puerto 3000
  aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 3000 \
    --cidr 0.0.0.0/0 \
    --region "$REGION" 2>/dev/null || echo "   ⚠️  Regla ya existe"
  
  echo "   ✅ Security Group creado: $SG_ID"
else
  echo "   ✅ Security Group ya existe: $SG_ID"
fi

# ============================================
# 6. CREAR CLOUDWATCH LOG GROUP
# ============================================
echo ""
echo "6️⃣ Creando CloudWatch Log Group..."
LOG_GROUP="/ecs/$TASK_FAMILY"

aws logs create-log-group \
  --log-group-name "$LOG_GROUP" \
  --region "$REGION" 2>/dev/null || echo "   ✅ Log Group ya existe"

# ============================================
# 7. CREAR TASK DEFINITION
# ============================================
echo ""
echo "7️⃣ Creando Task Definition..."

cat > /tmp/task-definition.json <<EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "$TASK_EXEC_ROLE_ARN",
  "taskRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "gua-clinic-api",
      "image": "$REPO_URI:$IMAGE_TAG",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        },
        {
          "name": "DRICLOUD_MOCK_MODE",
          "value": "false"
        },
        {
          "name": "AWS_REGION",
          "value": "$REGION"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$LOG_GROUP",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-definition.json \
  --region "$REGION" > /dev/null

echo "   ✅ Task Definition creada/actualizada"

# ============================================
# 8. CREAR O ACTUALIZAR ECS SERVICE
# ============================================
echo ""
echo "8️⃣ Creando ECS Service..."

# Verificar si el servicio ya existe
if aws ecs describe-services \
  --cluster "$CLUSTER_NAME" \
  --services "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'services[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
  
  echo "   🔄 Servicio ya existe, actualizando..."
  aws ecs update-service \
    --cluster "$CLUSTER_NAME" \
    --service "$SERVICE_NAME" \
    --task-definition "$TASK_FAMILY" \
    --force-new-deployment \
    --region "$REGION" > /dev/null
  echo "   ✅ Servicio actualizado"
else
  echo "   🆕 Creando nuevo servicio..."
  aws ecs create-service \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --task-definition "$TASK_FAMILY" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
    --region "$REGION" > /dev/null
  echo "   ✅ Servicio creado"
fi

# ============================================
# 9. OBTENER IP PÚBLICA DEL TASK
# ============================================
echo ""
echo "9️⃣ Esperando a que el servicio esté estable..."
sleep 10

echo "   🔍 Obteniendo IP pública del task..."

# Esperar a que haya un task running
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  TASK_ARN=$(aws ecs list-tasks \
    --cluster "$CLUSTER_NAME" \
    --service-name "$SERVICE_NAME" \
    --region "$REGION" \
    --query 'taskArns[0]' --output text 2>/dev/null)
  
  if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
    # Obtener detalles del task
    ENI_ID=$(aws ecs describe-tasks \
      --cluster "$CLUSTER_NAME" \
      --tasks "$TASK_ARN" \
      --region "$REGION" \
      --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
      --output text 2>/dev/null)
    
    if [ ! -z "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
      PUBLIC_IP=$(aws ec2 describe-network-interfaces \
        --network-interface-ids "$ENI_ID" \
        --region "$REGION" \
        --query 'NetworkInterfaces[0].Association.PublicIp' \
        --output text 2>/dev/null)
      
      if [ ! -z "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        # ============================================
        # 10. ACTUALIZAR API GATEWAY AUTOMÁTICAMENTE
        # ============================================
        echo ""
        echo "🔟 Actualizando API Gateway con la nueva IP..."
        SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        if [ -f "$SCRIPT_DIR/update-api-gateway-ip.sh" ]; then
          "$SCRIPT_DIR/update-api-gateway-ip.sh" > /dev/null 2>&1
          echo "   ✅ API Gateway actualizado automáticamente"
        else
          echo "   ⚠️  Script de actualización no encontrado, ejecuta manualmente:"
          echo "      ./update-api-gateway-ip.sh"
        fi
        
        echo ""
        echo "═══════════════════════════════════════"
        echo "✅ DESPLIEGUE COMPLETADO"
        echo "═══════════════════════════════════════"
        echo ""
        echo "🌐 Tu API está disponible en:"
        echo "   http://$PUBLIC_IP:3000"
        echo ""
        echo "🌐 API Gateway (HTTPS):"
        echo "   https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod"
        echo ""
        echo "📋 Endpoints disponibles:"
        echo "   - https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod/bootstrap"
        echo "   - https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod/medical-specialties"
        echo "   - https://4mbksaqi36.execute-api.eu-north-1.amazonaws.com/prod/api/docs"
        echo ""
        echo "💡 El API Gateway se actualizó automáticamente con la nueva IP"
        echo "   Si la IP cambia en el futuro, ejecuta: ./update-api-gateway-ip.sh"
        echo ""
        echo "💰 Costo estimado: ~$18/mes (sin Load Balancer)"
        echo ""
        exit 0
      fi
    fi
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo -n "."
  sleep 2
done

echo ""
echo "⚠️  No se pudo obtener la IP pública automáticamente"
echo "   Ejecuta estos comandos manualmente:"
echo ""
echo "   # Obtener task ARN:"
echo "   aws ecs list-tasks --cluster $CLUSTER_NAME --region $REGION"
echo ""
echo "   # Obtener IP pública:"
echo "   aws ecs describe-tasks --cluster $CLUSTER_NAME --tasks [TASK_ARN] --region $REGION"


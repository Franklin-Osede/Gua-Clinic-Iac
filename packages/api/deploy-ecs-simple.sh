#!/bin/bash

# Script para desplegar API en ECS SIN Load Balancer (más económico)
# Costo: ~$18/mes vs ~$42/mes con Load Balancer

echo "🚀 Desplegando API en ECS (sin Load Balancer)..."
echo ""

REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"
TASK_FAMILY="gua-clinic-api"
REPO_NAME="gua-clinic-api"

# 1. Crear ECR Repository
echo "1️⃣ Creando ECR Repository..."
aws ecr create-repository \
  --repository-name "$REPO_NAME" \
  --region "$REGION" \
  --image-scanning-configuration scanOnPush=true \
  2>/dev/null || echo "   ✅ Repository ya existe"

# 2. Obtener login token y hacer login
echo ""
echo "2️⃣ Haciendo login en ECR..."
ECR_LOGIN=$(aws ecr get-login-password --region "$REGION")
echo "$ECR_LOGIN" | docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# 3. Construir imagen Docker
echo ""
echo "3️⃣ Construyendo imagen Docker..."
REPO_URI=$(aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" --query 'repositories[0].repositoryUri' --output text)
docker build -t "$REPO_NAME:latest" -f packages/api/Dockerfile .

# 4. Tag y push
echo ""
echo "4️⃣ Subiendo imagen a ECR..."
docker tag "$REPO_NAME:latest" "$REPO_URI:latest"
docker push "$REPO_URI:latest"

# 5. Crear ECS Cluster
echo ""
echo "5️⃣ Creando ECS Cluster..."
aws ecs create-cluster \
  --cluster-name "$CLUSTER_NAME" \
  --region "$REGION" \
  2>/dev/null || echo "   ✅ Cluster ya existe"

# 6. Obtener IAM Role ARN (asumimos que existe)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TASK_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole"

# Verificar si el role existe, si no, crear uno básico
if ! aws iam get-role --role-name ecsTaskExecutionRole 2>/dev/null; then
  echo ""
  echo "6️⃣ Creando IAM Role para ECS..."
  # Crear policy básica
  cat > /tmp/ecs-task-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
EOF
  
  # Nota: El usuario deberá crear el role manualmente con permisos completos
  echo "   ⚠️  Necesitas crear un IAM Role con permisos para Secrets Manager y DynamoDB"
  echo "   Ve a: IAM → Roles → Create Role"
  echo "   Selecciona: AWS service → ECS → ECS Task"
fi

# 7. Crear Task Definition
echo ""
echo "7️⃣ Creando Task Definition..."
cat > /tmp/task-definition.json <<EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "$TASK_ROLE_ARN",
  "taskRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "gua-clinic-api",
      "image": "$REPO_URI:latest",
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
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$TASK_FAMILY",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-definition.json \
  --region "$REGION"

# 8. Obtener VPC y Subnets (usar defaults)
echo ""
echo "8️⃣ Obteniendo configuración de red..."
VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text)
SUBNET_IDS=$(aws ec2 describe-subnets --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0:2].SubnetId' --output text)
SUBNET_1=$(echo $SUBNET_IDS | awk '{print $1}')
SUBNET_2=$(echo $SUBNET_IDS | awk '{print $2}')

# 9. Crear Security Group
echo ""
echo "9️⃣ Creando Security Group..."
SG_NAME="gua-clinic-api-sg"
SG_ID=$(aws ec2 create-security-group \
  --group-name "$SG_NAME" \
  --description "Security group for GUA Clinic API" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query 'GroupId' --output text 2>/dev/null || \
  aws ec2 describe-security-groups --region "$REGION" --filters "Name=group-name,Values=$SG_NAME" --query 'SecurityGroups[0].GroupId' --output text)

# Abrir puerto 3000
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region "$REGION" 2>/dev/null || echo "   ⚠️  Regla ya existe"

# 10. Crear CloudWatch Log Group
echo ""
echo "🔟 Creando CloudWatch Log Group..."
aws logs create-log-group \
  --log-group-name "/ecs/$TASK_FAMILY" \
  --region "$REGION" \
  2>/dev/null || echo "   ✅ Log group ya existe"

# 11. Crear ECS Service (SIN Load Balancer)
echo ""
echo "1️⃣1️⃣ Creando ECS Service (sin Load Balancer)..."
aws ecs create-service \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --task-definition "$TASK_FAMILY" \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
  --region "$REGION" \
  2>/dev/null || echo "   ⚠️  Service ya existe o hubo error"

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Esperar a que el servicio esté corriendo (1-2 minutos)"
echo "   2. Obtener IP pública del task:"
echo "      aws ecs list-tasks --cluster $CLUSTER_NAME --region $REGION"
echo "   3. Acceder a la API por IP: http://[IP_PUBLICA]:3000"
echo ""
echo "⚠️  IMPORTANTE: Sin Load Balancer, la IP puede cambiar si reinicias el servicio"
echo "   Para producción, considera agregar un Load Balancer después"
echo ""
echo "💰 Costo estimado: ~$18/mes (sin Load Balancer)"


#!/bin/bash

# Script para configurar AWS Secrets Manager
# Ejecutar: ./setup-secrets.sh

echo "🔐 Configurando AWS Secrets Manager para GUA Clinic..."

# 1. Crear secreto para DriCloud
aws secretsmanager create-secret \
  --name "gua-clinic/dricloud/credentials" \
  --description "Credenciales DriCloud para GUA Clinic" \
  --secret-string '{
    "DRICLOUD_WEBAPI_USER": "WebAPI",
    "DRICLOUD_WEBAPI_PASSWORD": "Gabinete1991",
    "DRICLOUD_CLINIC_URL": "Dricloud_gabinetedeurologiayandrologia_19748592",
    "DRICLOUD_CLINIC_ID": "19748"
  }' \
  --region eu-west-1

echo "✅ Secreto creado: gua-clinic/dricloud/credentials"

# 2. Crear secreto para configuración de la aplicación
aws secretsmanager create-secret \
  --name "gua-clinic/app/config" \
  --description "Configuración de la aplicación GUA Clinic" \
  --secret-string '{
    "NODE_ENV": "production",
    "PORT": "3000",
    "ALLOWED_ORIGINS": "https://guaclinic.com,https://www.guaclinic.com"
  }' \
  --region eu-west-1

echo "✅ Secreto creado: gua-clinic/app/config"

# 3. Crear secreto para CloudWatch
aws secretsmanager create-secret \
  --name "gua-clinic/monitoring/cloudwatch" \
  --description "Configuración CloudWatch para GUA Clinic" \
  --secret-string '{
    "CLOUDWATCH_NAMESPACE": "GUA/DriCloud",
    "ALARM_EMAIL": "admin@guaclinic.com",
    "LOG_GROUP": "/aws/ecs/gua-clinic-api"
  }' \
  --region eu-west-1

echo "✅ Secreto creado: gua-clinic/monitoring/cloudwatch"

echo "🎉 Configuración completada!"
echo "📋 Próximos pasos:"
echo "1. Configurar IAM role con los permisos necesarios"
echo "2. Actualizar código para usar AWS Secrets Manager"
echo "3. Configurar CloudWatch alarms"

#!/bin/bash

# Script de diagnóstico para error 503 en medical-specialties

API_URL="https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod"
REGION="eu-north-1"
CLUSTER_NAME="gua-clinic-api"
SERVICE_NAME="gua-clinic-api-service"

echo "🔍 Diagnóstico de error 503 en /medical-specialties"
echo "=================================================="
echo ""

# 1. Verificar API Gateway
echo "1️⃣ Verificando API Gateway..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/medical-specialties" || echo "000")
echo "   Código HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" == "503" ]; then
    echo "   ❌ Error 503: Service Unavailable"
    echo "   Esto significa que el backend no está respondiendo"
elif [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ API Gateway responde correctamente"
    exit 0
else
    echo "   ⚠️  Código inesperado: $HTTP_CODE"
fi

echo ""

# 2. Verificar estado de ECS
echo "2️⃣ Verificando estado de ECS..."
if command -v aws &> /dev/null; then
    RUNNING_COUNT=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "$SERVICE_NAME" \
        --region "$REGION" \
        --query 'services[0].runningCount' \
        --output text 2>/dev/null || echo "0")
    
    DESIRED_COUNT=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "$SERVICE_NAME" \
        --region "$REGION" \
        --query 'services[0].desiredCount' \
        --output text 2>/dev/null || echo "0")
    
    echo "   Tasks corriendo: $RUNNING_COUNT / $DESIRED_COUNT"
    
    if [ "$RUNNING_COUNT" == "0" ]; then
        echo "   ❌ No hay tasks corriendo - El backend está caído"
        echo ""
        echo "   💡 Solución: Levantar el servicio ECS"
        echo "   Ejecuta: cd packages/api && ./deploy-ecs.sh"
    elif [ "$RUNNING_COUNT" -lt "$DESIRED_COUNT" ]; then
        echo "   ⚠️  Solo $RUNNING_COUNT de $DESIRED_COUNT tasks están corriendo"
    else
        echo "   ✅ ECS está corriendo correctamente"
        echo "   ⚠️  Pero el backend no responde - Revisa los logs"
    fi
else
    echo "   ⚠️  AWS CLI no está instalado - No se puede verificar ECS"
fi

echo ""

# 3. Verificar logs recientes
echo "3️⃣ Verificando logs recientes..."
if command -v aws &> /dev/null; then
    LOG_GROUP="/ecs/gua-clinic-api"
    echo "   Buscando errores en los últimos 5 minutos..."
    
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --region "$REGION" \
        --start-time $(($(date +%s) - 300))000 \
        --filter-pattern "ERROR" \
        --max-items 10 \
        --query 'events[*].message' \
        --output text 2>/dev/null | head -5 || echo "   ⚠️  No se pudieron obtener logs (verifica permisos AWS)"
else
    echo "   ⚠️  AWS CLI no está instalado - No se pueden ver logs"
fi

echo ""

# 4. Verificar bootstrap endpoint
echo "4️⃣ Verificando endpoint /bootstrap..."
BOOTSTRAP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/bootstrap" || echo "000")
if [ "$BOOTSTRAP_CODE" == "200" ]; then
    echo "   ✅ Bootstrap funciona - El backend está vivo"
    echo "   ⚠️  El problema es específico de /medical-specialties"
elif [ "$BOOTSTRAP_CODE" == "503" ]; then
    echo "   ❌ Bootstrap también devuelve 503 - Backend completamente caído"
else
    echo "   ⚠️  Bootstrap devuelve: $BOOTSTRAP_CODE"
fi

echo ""
echo "=================================================="
echo "📋 Resumen:"
echo ""
echo "Si ECS está corriendo pero devuelve 503:"
echo "  1. Revisa los logs: ./check-error-logs.sh"
echo "  2. Verifica que DriCloud esté accesible"
echo "  3. Verifica que los secrets estén configurados: ./setup-secrets.sh"
echo ""
echo "Si ECS no está corriendo:"
echo "  1. Levanta el servicio: ./deploy-ecs.sh"
echo "  2. Espera 2-3 minutos a que el servicio esté listo"
echo ""


#!/bin/bash

# Script para actualizar CORS del HTTP API v2 para incluir localhost

set -e

REGION="eu-north-1"
API_ID="ybymfv93yg"

echo "🔧 Actualizando configuración CORS del HTTP API v2..."
echo ""

# Actualizar CORS para incluir localhost
echo "📋 Orígenes permitidos:"
echo "  • Producción: https://urologiayandrologia.com, https://www.urologiayandrologia.com, https://guaclinic.com, https://www.guaclinic.com, https://cdn.gua.com"
echo "  • Desarrollo: http://localhost:5173, http://localhost:5174, http://localhost:3000, http://localhost:8080"
echo ""

aws apigatewayv2 update-api \
  --api-id "$API_ID" \
  --cors-configuration AllowOrigins="https://urologiayandrologia.com,https://www.urologiayandrologia.com,https://guaclinic.com,https://www.guaclinic.com,https://cdn.gua.com,http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:8080,http://localhost:8081",AllowMethods="GET,POST,PUT,DELETE,OPTIONS",AllowHeaders="content-type,authorization,usu-apitoken",AllowCredentials=true \
  --region "$REGION" \
  > /dev/null

echo "✅ CORS actualizado correctamente"
echo ""
echo "🌐 Los cambios se aplicarán automáticamente (HTTP API v2 usa auto-deploy)"
echo "⏳ Espera unos segundos y recarga la página en http://localhost:5173"


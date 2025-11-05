#!/bin/bash

# Script para probar los endpoints y ver qué devuelven
# Uso: ./test-commands.sh [API_URL]

API_URL="${1:-https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod}"
COOKIE_FILE="/tmp/gua_test_cookies.txt"

echo "═══════════════════════════════════════════════════════════"
echo "  Test de Endpoints - Verificación de Disponibilidad"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "API URL: $API_URL"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Limpiar cookies anteriores
rm -f "$COOKIE_FILE"

# Test 1: Bootstrap
echo -e "${BLUE}[TEST 1]${NC} Inicializando sesión (GET /bootstrap)..."
echo ""
BOOTSTRAP_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/bootstrap" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_FILE" 2>&1)

HTTP_CODE=$(echo "$BOOTSTRAP_RESPONSE" | tail -1)
BODY=$(echo "$BOOTSTRAP_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Éxito (HTTP $HTTP_CODE)${NC}"
  echo "Respuesta:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}❌ Error (HTTP $HTTP_CODE)${NC}"
  echo "Respuesta:"
  echo "$BODY"
fi
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Test 2: Obtener disponibilidad
echo -e "${BLUE}[TEST 2]${NC} Obteniendo disponibilidad (GET /doctor-availability/1/2025-01-15)..."
echo ""

# Usar fecha de hoy + 7 días
START_DATE=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d "+7 days" +%Y-%m-%d 2>/dev/null || echo "2025-01-15")
DOCTOR_ID=1

AVAILABILITY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${API_URL}/doctor-availability/${DOCTOR_ID}/${START_DATE}?dates_to_fetch=7" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" 2>&1)

HTTP_CODE=$(echo "$AVAILABILITY_RESPONSE" | tail -1)
BODY=$(echo "$AVAILABILITY_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Éxito (HTTP $HTTP_CODE)${NC}"
  echo "Respuesta:"
  
  # Intentar formatear como JSON
  if echo "$BODY" | jq '.' >/dev/null 2>&1; then
    echo "$BODY" | jq '.'
    
    # Verificar si es formato DriCloud (con Data.Disponibilidad) o array directo
    DISPONIBILIDAD=$(echo "$BODY" | jq -r '.Data.Disponibilidad // . // empty' 2>/dev/null)
    
    if [ -n "$DISPONIBILIDAD" ] && [ "$DISPONIBILIDAD" != "null" ]; then
      SLOT_COUNT=$(echo "$DISPONIBILIDAD" | jq '. | length' 2>/dev/null || echo "0")
      echo ""
      echo -e "${YELLOW}📊 Total de slots disponibles: ${SLOT_COUNT}${NC}"
      
      # Mostrar primeros 5 slots
      if [ "$SLOT_COUNT" -gt 0 ]; then
        echo ""
        echo "Primeros 5 slots:"
        echo "$DISPONIBILIDAD" | jq '.[:5]' 2>/dev/null || echo "$DISPONIBILIDAD" | head -5
        echo ""
        echo -e "${BLUE}💡 Formato de cada slot:${NC}"
        echo "   yyyyMMddHHmm:<Minutos>:<DES_ID>:<USU_ID>"
        echo "   Ejemplo: 202511151000:30:1:1 = 15 Nov 2025 a las 10:00 (30 min)"
      else
        echo ""
        echo -e "${YELLOW}⚠️  No hay slots disponibles para este doctor/fecha${NC}"
      fi
    else
      # Si es array directo
      SLOT_COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null || echo "0")
      echo ""
      echo -e "${YELLOW}📊 Total de slots disponibles: ${SLOT_COUNT}${NC}"
      if [ "$SLOT_COUNT" -gt 0 ]; then
        echo ""
        echo "Primeros 5 slots:"
        echo "$BODY" | jq '.[:5]' 2>/dev/null
      fi
    fi
  else
    echo "$BODY"
  fi
else
  echo -e "${RED}❌ Error (HTTP $HTTP_CODE)${NC}"
  echo "Respuesta:"
  echo "$BODY"
fi
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""

# Test 3: Información sobre crear cita
echo -e "${BLUE}[TEST 3]${NC} Información para crear cita"
echo ""
echo -e "${YELLOW}Para crear una cita necesitas:${NC}"
echo "  - PAC_ID (ID del paciente - debe existir en DriCloud)"
echo "  - USU_ID (ID del doctor) = $DOCTOR_ID"
echo "  - FECHA = YYYY-MM-DD"
echo "  - HORA = HH:MM"
echo ""
echo -e "${YELLOW}Ejemplo de comando curl:${NC}"
echo ""
cat << EOF
curl -X POST "${API_URL}/appointment" \\
  -H "Content-Type: application/json" \\
  -H "X-Request-ID: test_\$(date +%s)" \\
  -b "$COOKIE_FILE" \\
  -d '{
    "PAC_ID": 123,
    "USU_ID": $DOCTOR_ID,
    "FECHA": "$START_DATE",
    "HORA": "10:00",
    "OBSERVACIONES": "Cita de prueba"
  }'
EOF
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Tests completados${NC}"
echo "═══════════════════════════════════════════════════════════"

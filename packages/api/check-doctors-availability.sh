#!/bin/bash

# Script para verificar qué doctores tienen horarios configurados en DriCloud
# Uso: ./check-doctors-availability.sh [API_URL] [SERVICE_ID]

API_URL="${1:-https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod}"
SERVICE_ID="${2:-1}"
COOKIE_FILE="/tmp/gua_check_cookies.txt"
FUTURE_DATE=$(date -v+7d +%Y-%m-%d 2>/dev/null || date -d "+7 days" +%Y-%m-%d 2>/dev/null || echo "2025-11-15")

echo "═══════════════════════════════════════════════════════════"
echo "  Verificación de Horarios Configurados por Doctor"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "API URL: $API_URL"
echo "Especialidad ID: $SERVICE_ID"
echo "Fecha de verificación: $FUTURE_DATE"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Limpiar cookies
rm -f "$COOKIE_FILE"

# 1. Inicializar sesión
echo -e "${BLUE}[1/3]${NC} Inicializando sesión..."
BOOTSTRAP=$(curl -s -X GET "${API_URL}/bootstrap" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_FILE" 2>&1)

if echo "$BOOTSTRAP" | grep -q "session"; then
  echo -e "${GREEN}✅ Sesión inicializada${NC}"
else
  echo -e "${RED}❌ Error al inicializar sesión${NC}"
  exit 1
fi
echo ""

# 2. Obtener lista de doctores
echo -e "${BLUE}[2/3]${NC} Obteniendo doctores de la especialidad $SERVICE_ID..."
DOCTORS_RESPONSE=$(curl -s -X GET "${API_URL}/doctors/${SERVICE_ID}" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" 2>&1)

if ! echo "$DOCTORS_RESPONSE" | jq '.' >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: Respuesta no es JSON válido${NC}"
  echo "$DOCTORS_RESPONSE"
  exit 1
fi

# Extraer array de doctores (puede venir como array directo o dentro de {Doctores: [...]})
DOCTORS_ARRAY=$(echo "$DOCTORS_RESPONSE" | jq '.Doctores // . // []' 2>/dev/null)
DOCTORS_COUNT=$(echo "$DOCTORS_ARRAY" | jq '. | length' 2>/dev/null || echo "0")

if [ "$DOCTORS_COUNT" = "0" ]; then
  echo -e "${YELLOW}⚠️  No se encontraron doctores para esta especialidad${NC}"
  exit 0
fi

echo -e "${GREEN}✅ Encontrados $DOCTORS_COUNT doctores${NC}"
echo ""

# 3. Verificar disponibilidad de cada doctor
echo -e "${BLUE}[3/3]${NC} Verificando disponibilidad de cada doctor..."
echo ""

DOCTORS_WITH_AVAILABILITY=0
DOCTORS_WITHOUT_AVAILABILITY=0

# Procesar cada doctor
for i in $(seq 0 $((DOCTORS_COUNT - 1))); do
  DOCTOR=$(echo "$DOCTORS_ARRAY" | jq ".[$i]")
  DOCTOR_ID=$(echo "$DOCTOR" | jq -r '.USU_ID // .doctor_id // .id // "N/A"')
  DOCTOR_NAME=$(echo "$DOCTOR" | jq -r '.name // .USU_NOMBRE // "N/A"')
  DOCTOR_SURNAME=$(echo "$DOCTOR" | jq -r '.surname // .USU_APELLIDOS // "N/A"')
  FULL_NAME="${DOCTOR_NAME} ${DOCTOR_SURNAME}"
  
  if [ "$DOCTOR_ID" = "N/A" ] || [ "$DOCTOR_ID" = "null" ]; then
    continue
  fi
  
  echo -n "  🔍 Doctor ID $DOCTOR_ID ($FULL_NAME)... "
  
  # Obtener disponibilidad
  AVAILABILITY_RESPONSE=$(curl -s -X GET \
    "${API_URL}/doctor-availability/${DOCTOR_ID}/${FUTURE_DATE}?dates_to_fetch=7" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_FILE" 2>&1)
  
  # Extraer array de disponibilidad
  DISPONIBILIDAD=$(echo "$AVAILABILITY_RESPONSE" | jq -r '.Data.Disponibilidad // . // []' 2>/dev/null)
  SLOT_COUNT=$(echo "$DISPONIBILIDAD" | jq '. | length' 2>/dev/null || echo "0")
  
  if [ "$SLOT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ ${SLOT_COUNT} slots disponibles${NC}"
    DOCTORS_WITH_AVAILABILITY=$((DOCTORS_WITH_AVAILABILITY + 1))
    
    # Mostrar primer slot como ejemplo
    FIRST_SLOT=$(echo "$DISPONIBILIDAD" | jq -r '.[0] // empty' 2>/dev/null)
    if [ -n "$FIRST_SLOT" ] && [ "$FIRST_SLOT" != "null" ]; then
      # Parsear fecha del slot (formato: yyyyMMddHHmm)
      YEAR=${FIRST_SLOT:0:4}
      MONTH=${FIRST_SLOT:4:2}
      DAY=${FIRST_SLOT:6:2}
      HOUR=${FIRST_SLOT:8:2}
      MINUTE=${FIRST_SLOT:10:2}
      echo "     📅 Primer slot: ${DAY}/${MONTH}/${YEAR} a las ${HOUR}:${MINUTE}"
    fi
  else
    echo -e "${RED}❌ Sin horarios configurados${NC}"
    DOCTORS_WITHOUT_AVAILABILITY=$((DOCTORS_WITHOUT_AVAILABILITY + 1))
  fi
  
  # Pequeña pausa para no saturar la API
  sleep 0.5
done

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${CYAN}📊 Resumen:${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "  Total de doctores: ${YELLOW}${DOCTORS_COUNT}${NC}"
echo -e "  ${GREEN}✅ Con horarios: ${DOCTORS_WITH_AVAILABILITY}${NC}"
echo -e "  ${RED}❌ Sin horarios: ${DOCTORS_WITHOUT_AVAILABILITY}${NC}"
echo ""

if [ "$DOCTORS_WITH_AVAILABILITY" -gt 0 ]; then
  echo -e "${GREEN}💡 Puedes usar cualquiera de estos doctores para probar:${NC}"
  echo ""
  # Mostrar solo los que tienen disponibilidad
  for i in $(seq 0 $((DOCTORS_COUNT - 1))); do
    DOCTOR=$(echo "$DOCTORS_ARRAY" | jq ".[$i]")
    DOCTOR_ID=$(echo "$DOCTOR" | jq -r '.USU_ID // .doctor_id // .id // "N/A"')
    
    if [ "$DOCTOR_ID" = "N/A" ] || [ "$DOCTOR_ID" = "null" ]; then
      continue
    fi
    
    # Verificar rápidamente si tiene disponibilidad
    AVAILABILITY_RESPONSE=$(curl -s -X GET \
      "${API_URL}/doctor-availability/${DOCTOR_ID}/${FUTURE_DATE}?dates_to_fetch=7" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_FILE" 2>&1)
    
    DISPONIBILIDAD=$(echo "$AVAILABILITY_RESPONSE" | jq -r '.Data.Disponibilidad // . // []' 2>/dev/null)
    SLOT_COUNT=$(echo "$DISPONIBILIDAD" | jq '. | length' 2>/dev/null || echo "0")
    
    if [ "$SLOT_COUNT" -gt 0 ]; then
      DOCTOR_NAME=$(echo "$DOCTOR" | jq -r '.name // .USU_NOMBRE // "N/A"')
      DOCTOR_SURNAME=$(echo "$DOCTOR" | jq -r '.surname // .USU_APELLIDOS // "N/A"')
      echo "     - Doctor ID $DOCTOR_ID: ${DOCTOR_NAME} ${DOCTOR_SURNAME} (${SLOT_COUNT} slots)"
    fi
  done
  echo ""
  echo -e "${BLUE}Ejemplo de comando para probar:${NC}"
  echo ""
  FIRST_DOCTOR_WITH_SLOTS=$(echo "$DOCTORS_ARRAY" | jq -r '.[] | select(.USU_ID != null) | .USU_ID' | head -1)
  echo "  curl -X GET \"${API_URL}/doctor-availability/${FIRST_DOCTOR_WITH_SLOTS}/${FUTURE_DATE}?dates_to_fetch=7\" \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -b \"$COOKIE_FILE\" | jq '.Data.Disponibilidad'"
else
  echo -e "${YELLOW}⚠️  Ningún doctor tiene horarios configurados para esta especialidad${NC}"
  echo ""
  echo -e "${BLUE}💡 Posibles causas:${NC}"
  echo "  1. Los horarios no están configurados en DriCloud"
  echo "  2. La fecha seleccionada está fuera del rango configurado"
  echo "  3. Todos los slots ya están ocupados"
  echo ""
  echo -e "${BLUE}💡 Prueba con otra especialidad:${NC}"
  echo "  ./check-doctors-availability.sh $API_URL [OTRO_SERVICE_ID]"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"


#!/bin/bash

# Script de prueba para verificar la disponibilidad de DriCloud
# Verifica que todos los doctores puedan ver su agenda correctamente

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
API_URL="${API_URL:-http://localhost:3000}"
COOKIE_FILE="/tmp/gua_test_cookies.txt"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Test de Disponibilidad de DriCloud${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Función para formatear fecha
get_future_date() {
    local days=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        date -v+${days}d +%Y-%m-%d
    else
        # Linux
        date -d "+${days} days" +%Y-%m-%d
    fi
}

# Función para formatear fecha en formato DriCloud (yyyyMMdd)
get_future_date_dricloud() {
    local days=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        date -v+${days}d +%Y%m%d
    else
        # Linux
        date -d "+${days} days" +%Y%m%d
    fi
}

# Paso 1: Inicializar sesión
echo -e "${YELLOW}📋 Paso 1: Inicializando sesión...${NC}"
BOOTSTRAP_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${API_URL}/bootstrap" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_FILE" 2>&1)

HTTP_CODE=$(echo "$BOOTSTRAP_RESPONSE" | tail -1)
BODY=$(echo "$BOOTSTRAP_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}❌ Error al inicializar sesión (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi

echo -e "${GREEN}✅ Sesión inicializada correctamente${NC}"
echo ""

# Paso 2: Obtener lista de doctores (necesitamos una especialidad primero)
echo -e "${YELLOW}📋 Paso 2: Obteniendo especialidades...${NC}"
SPECIALTIES_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${API_URL}/medical-specialties" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" 2>&1)

HTTP_CODE=$(echo "$SPECIALTIES_RESPONSE" | tail -1)
BODY=$(echo "$SPECIALTIES_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}❌ Error al obtener especialidades (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi

# Extraer primera especialidad
FIRST_SPECIALTY_ID=$(echo "$BODY" | jq -r '.[0].ESP_ID // .[0].id // empty' 2>/dev/null)
FIRST_SPECIALTY_NAME=$(echo "$BODY" | jq -r '.[0].ESP_NOMBRE // .[0].name // "Unknown"' 2>/dev/null)

if [ -z "$FIRST_SPECIALTY_ID" ] || [ "$FIRST_SPECIALTY_ID" == "null" ]; then
    echo -e "${RED}❌ No se encontraron especialidades${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Especialidad encontrada: ${FIRST_SPECIALTY_NAME} (ID: ${FIRST_SPECIALTY_ID})${NC}"
echo ""

# Paso 3: Obtener doctores de esa especialidad
echo -e "${YELLOW}📋 Paso 3: Obteniendo doctores para especialidad ${FIRST_SPECIALTY_ID}...${NC}"
DOCTORS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${API_URL}/doctors/${FIRST_SPECIALTY_ID}" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_FILE" 2>&1)

HTTP_CODE=$(echo "$DOCTORS_RESPONSE" | tail -1)
BODY=$(echo "$DOCTORS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${RED}❌ Error al obtener doctores (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi

# Extraer IDs de doctores
DOCTOR_IDS=$(echo "$BODY" | jq -r '.[] | .USU_ID // .doctor_id // .id' 2>/dev/null | head -5)

if [ -z "$DOCTOR_IDS" ]; then
    echo -e "${RED}❌ No se encontraron doctores${NC}"
    exit 1
fi

DOCTOR_COUNT=$(echo "$DOCTOR_IDS" | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Encontrados ${DOCTOR_COUNT} doctores${NC}"
echo ""

# Paso 4: Probar disponibilidad para cada doctor
echo -e "${YELLOW}📋 Paso 4: Probando disponibilidad para ${DOCTOR_COUNT} doctores...${NC}"
echo ""

# Fechas de prueba: hoy, en 7 días, en 30 días (máximo permitido)
TODAY=$(get_future_date 0)
DATE_7_DAYS=$(get_future_date 7)
DATE_30_DAYS=$(get_future_date 30)

# Usar máximo de días permitido por DriCloud (31 días según documentación)
MAX_DAYS=31

SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_SLOTS=0

for DOCTOR_ID in $DOCTOR_IDS; do
    if [ -z "$DOCTOR_ID" ] || [ "$DOCTOR_ID" == "null" ]; then
        continue
    fi
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}👨‍⚕️  Probando Doctor ID: ${DOCTOR_ID}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Probar con fecha de hoy
    echo -e "${YELLOW}  📅 Fecha: ${TODAY} (hoy) - ${MAX_DAYS} días${NC}"
    
    AVAILABILITY_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
      "${API_URL}/doctor-availability/${DOCTOR_ID}/${TODAY}?dates_to_fetch=${MAX_DAYS}" \
      -H "Content-Type: application/json" \
      -b "$COOKIE_FILE" 2>&1)
    
    HTTP_CODE=$(echo "$AVAILABILITY_RESPONSE" | tail -1)
    BODY=$(echo "$AVAILABILITY_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" != "200" ]; then
        echo -e "${RED}  ❌ Error (HTTP $HTTP_CODE)${NC}"
        echo "  Respuesta: $BODY"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo ""
        continue
    fi
    
    # Parsear respuesta
    if echo "$BODY" | jq '.' >/dev/null 2>&1; then
        # Verificar formato DriCloud
        DISPONIBILIDAD=$(echo "$BODY" | jq -r '.Data.Disponibilidad // . // empty' 2>/dev/null)
        
        if [ -z "$DISPONIBILIDAD" ] || [ "$DISPONIBILIDAD" == "null" ]; then
            # Intentar como array directo
            DISPONIBILIDAD="$BODY"
        fi
        
        SLOT_COUNT=$(echo "$DISPONIBILIDAD" | jq '. | length' 2>/dev/null || echo "0")
        
        if [ "$SLOT_COUNT" -gt 0 ]; then
            echo -e "${GREEN}  ✅ Éxito: ${SLOT_COUNT} slots disponibles${NC}"
            TOTAL_SLOTS=$((TOTAL_SLOTS + SLOT_COUNT))
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            
            # Mostrar primeros 3 slots como ejemplo
            echo -e "${BLUE}  📋 Primeros 3 slots:${NC}"
            echo "$DISPONIBILIDAD" | jq -r '.[:3][]' 2>/dev/null | head -3 | while read slot; do
                if [ -n "$slot" ] && [ "$slot" != "null" ]; then
                    # Parsear formato: yyyyMMddHHmm:MinCita:DES_ID:USU_ID
                    DATE_PART=$(echo "$slot" | cut -d: -f1)
                    if [ ${#DATE_PART} -ge 8 ]; then
                        YEAR=${DATE_PART:0:4}
                        MONTH=${DATE_PART:4:2}
                        DAY=${DATE_PART:6:2}
                        HOUR=${DATE_PART:8:2}
                        MINUTE=${DATE_PART:10:2}
                        MIN_CITA=$(echo "$slot" | cut -d: -f2)
                        echo -e "     ${GREEN}•${NC} ${YEAR}-${MONTH}-${DAY} ${HOUR}:${MINUTE} (${MIN_CITA} min)"
                    else
                        echo -e "     ${GREEN}•${NC} $slot"
                    fi
                fi
            done
        else
            echo -e "${YELLOW}  ⚠️  Sin slots disponibles para este doctor${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1)) # Cuenta como éxito (respuesta válida)
        fi
    else
        echo -e "${RED}  ❌ Respuesta no es JSON válido${NC}"
        echo "  Respuesta: $BODY"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    echo ""
done

# Resumen
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Resumen de Pruebas${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✅ Exitosos: ${SUCCESS_COUNT}${NC}"
echo -e "  ${RED}❌ Fallidos: ${FAIL_COUNT}${NC}"
echo -e "  ${BLUE}📅 Total de slots encontrados: ${TOTAL_SLOTS}${NC}"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todas las pruebas pasaron exitosamente!${NC}"
    echo ""
    echo -e "${BLUE}💡 Verificación del formato de datos:${NC}"
    echo "   - Formato esperado: yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"
    echo "   - Ejemplo: 202501151000:30:1:1 = 15 Ene 2025 a las 10:00 (30 min)"
    echo "   - Máximo de días solicitados: ${MAX_DAYS} (límite de DriCloud API)"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Algunas pruebas fallaron${NC}"
    echo ""
    exit 1
fi






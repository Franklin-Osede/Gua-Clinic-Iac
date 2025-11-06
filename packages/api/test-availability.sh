#!/bin/bash

# Script para verificar la disponibilidad de citas y sincronización con DriCloud
# Uso: ./test-availability.sh [API_BASE_URL] [DOCTOR_ID] [START_DATE]

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración por defecto
API_BASE_URL="${1:-http://localhost:3000}"
DOCTOR_ID="${2:-1}"
START_DATE="${3:-$(date +%Y-%m-%d)}"  # Fecha actual en formato YYYY-MM-DD

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Test de Disponibilidad y Sincronización de Citas${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "API Base URL: ${YELLOW}${API_BASE_URL}${NC}"
echo -e "Doctor ID: ${YELLOW}${DOCTOR_ID}${NC}"
echo -e "Fecha inicio: ${YELLOW}${START_DATE}${NC}"
echo ""

# Paso 1: Inicializar sesión (si es necesario)
echo -e "${BLUE}[1/4]${NC} Inicializando sesión..."
BOOTSTRAP_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/bootstrap" \
  -H "Content-Type: application/json" \
  -c /tmp/gua_cookies.txt)

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error al inicializar sesión${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Sesión inicializada${NC}"
echo ""

# Paso 2: Obtener disponibilidad ANTES de crear cita
echo -e "${BLUE}[2/4]${NC} Obteniendo disponibilidad ANTES de crear cita..."
AVAILABILITY_BEFORE=$(curl -s -X GET \
  "${API_BASE_URL}/doctor-availability/${DOCTOR_ID}/${START_DATE}?dates_to_fetch=7" \
  -H "Content-Type: application/json" \
  -b /tmp/gua_cookies.txt)

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error al obtener disponibilidad${NC}"
  exit 1
fi

# Contar slots disponibles
SLOTS_COUNT_BEFORE=$(echo "$AVAILABILITY_BEFORE" | grep -o '"' | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Disponibilidad obtenida${NC}"
echo -e "   Slots disponibles (formato): ${YELLOW}${AVAILABILITY_BEFORE}${NC}"
echo ""

# Extraer primer slot disponible para reservar
FIRST_SLOT=$(echo "$AVAILABILITY_BEFORE" | grep -oE '[0-9]{12}' | head -1)
if [ -z "$FIRST_SLOT" ]; then
  echo -e "${YELLOW}⚠️  No hay slots disponibles para reservar${NC}"
  echo "   El test continuará verificando que no hay disponibilidad"
  FIRST_SLOT="202501011000"  # Fecha/hora de ejemplo
fi

# Parsear fecha/hora del slot
YEAR=${FIRST_SLOT:0:4}
MONTH=${FIRST_SLOT:4:2}
DAY=${FIRST_SLOT:6:2}
HOUR=${FIRST_SLOT:8:2}
MINUTE=${FIRST_SLOT:10:2}

DATE_FORMATTED="${YEAR}-${MONTH}-${DAY}"
TIME_FORMATTED="${HOUR}:${MINUTE}"

echo -e "${BLUE}📅 Slot seleccionado para reservar:${NC}"
echo -e "   Fecha: ${YELLOW}${DATE_FORMATTED}${NC}"
echo -e "   Hora: ${YELLOW}${TIME_FORMATTED}${NC}"
echo ""

# Paso 3: Crear una cita de prueba (requiere paciente)
echo -e "${BLUE}[3/4]${NC} Para crear una cita necesitas:"
echo -e "   - ${YELLOW}PAC_ID${NC} (ID del paciente)"
echo -e "   - ${YELLOW}USU_ID${NC} (ID del doctor) = ${DOCTOR_ID}"
echo -e "   - ${YELLOW}FECHA${NC} = ${DATE_FORMATTED}"
echo -e "   - ${YELLOW}HORA${NC} = ${TIME_FORMATTED}"
echo ""
echo -e "${YELLOW}💡 Ejemplo de comando curl para crear cita:${NC}"
echo ""
cat << EOF
curl -X POST "${API_BASE_URL}/appointment" \\
  -H "Content-Type: application/json" \\
  -H "X-Request-ID: test_\$(date +%s)" \\
  -b /tmp/gua_cookies.txt \\
  -d '{
    "PAC_ID": 123,
    "USU_ID": ${DOCTOR_ID},
    "FECHA": "${DATE_FORMATTED}",
    "HORA": "${TIME_FORMATTED}",
    "OBSERVACIONES": "Cita de prueba desde script"
  }'
EOF
echo ""
echo -e "${YELLOW}💡 O usa Postman con:${NC}"
echo -e "   URL: ${API_BASE_URL}/appointment"
echo -e "   Method: POST"
echo -e "   Headers: Content-Type: application/json, X-Request-ID: test_123"
echo -e "   Body (JSON):"
cat << EOF | sed 's/^/   /'
{
  "PAC_ID": 123,
  "USU_ID": ${DOCTOR_ID},
  "FECHA": "${DATE_FORMATTED}",
  "HORA": "${TIME_FORMATTED}",
  "OBSERVACIONES": "Cita de prueba"
}
EOF
echo ""

# Paso 4: Verificar disponibilidad DESPUÉS de crear cita
echo -e "${BLUE}[4/4]${NC} Después de crear la cita, ejecuta este comando para verificar:"
echo ""
cat << EOF
curl -X GET \\
  "${API_BASE_URL}/doctor-availability/${DOCTOR_ID}/${START_DATE}?dates_to_fetch=7" \\
  -H "Content-Type: application/json" \\
  -b /tmp/gua_cookies.txt | jq '.'
EOF
echo ""
echo -e "${GREEN}✅ El slot ${YELLOW}${FIRST_SLOT}${GREEN} NO debería aparecer en la nueva lista${NC}"
echo ""

# Función helper para comparar
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Comparación Automática${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Para hacer una comparación automática después de crear la cita:${NC}"
echo ""
cat << 'EOF'
# Obtener disponibilidad DESPUÉS
AVAILABILITY_AFTER=$(curl -s -X GET \
  "${API_BASE_URL}/doctor-availability/${DOCTOR_ID}/${START_DATE}?dates_to_fetch=7" \
  -H "Content-Type: application/json" \
  -b /tmp/gua_cookies.txt)

# Verificar si el slot ya no está disponible
if echo "$AVAILABILITY_AFTER" | grep -q "${FIRST_SLOT}"; then
  echo "❌ ERROR: El slot reservado todavía aparece como disponible"
  exit 1
else
  echo "✅ ÉXITO: El slot reservado ya no aparece en la disponibilidad"
fi
EOF

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Script completado${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"




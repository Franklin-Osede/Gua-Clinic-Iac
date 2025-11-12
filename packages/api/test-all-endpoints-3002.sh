#!/bin/bash

# Script para probar todos los endpoints y verificar datos de DriCloud

API_URL="http://localhost:3002"

echo "🧪 TESTING ALL ENDPOINTS - Verificando datos de DriCloud"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para probar endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "${BLUE}📋 Probando: ${name}${NC}"
    echo "   ${method} ${endpoint}"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${API_URL}${endpoint}")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "${API_URL}${endpoint}")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE/d')
    
    if [ "$http_code" == "200" ]; then
        echo -e "   ${GREEN}✅ HTTP 200${NC}"
        
        # Verificar si es un array
        if echo "$body" | jq -e '. | if type=="array" then true else false end' > /dev/null 2>&1; then
            count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "0")
            echo -e "   ${GREEN}✅ Respuesta es array con ${count} elementos${NC}"
            
            if [ "$count" -gt 0 ]; then
                echo -e "   ${GREEN}✅ Datos recibidos correctamente${NC}"
                echo "   Primer elemento:"
                echo "$body" | jq '.[0]' 2>/dev/null | head -5
            else
                echo -e "   ${YELLOW}⚠️  Array vacío${NC}"
            fi
        # Verificar si tiene estructura de DriCloud
        elif echo "$body" | jq -e '.Data' > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ Respuesta tiene estructura Data${NC}"
            echo "$body" | jq '.Data' 2>/dev/null | head -10
        # Verificar si es objeto con session
        elif echo "$body" | jq -e '.session' > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ Respuesta tiene session${NC}"
            echo "$body" | jq '.session.id' 2>/dev/null
        else
            echo -e "   ${YELLOW}⚠️  Formato desconocido${NC}"
            echo "$body" | head -5
        fi
    elif [ "$http_code" == "503" ]; then
        echo -e "   ${RED}❌ HTTP 503 - Service Unavailable${NC}"
        echo "   $body"
    elif [ "$http_code" == "504" ]; then
        echo -e "   ${RED}❌ HTTP 504 - Gateway Timeout${NC}"
    else
        echo -e "   ${RED}❌ HTTP ${http_code}${NC}"
        echo "$body" | head -3
    fi
    
    echo ""
}

# Verificar que el servidor esté corriendo
echo "🔍 Verificando que el servidor esté corriendo..."
if ! curl -s "${API_URL}/health" > /dev/null 2>&1 && ! curl -s "${API_URL}/bootstrap" > /dev/null 2>&1; then
    echo -e "${RED}❌ El servidor no está corriendo en ${API_URL}${NC}"
    echo "   Inicia el servidor con: npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✅ Servidor está corriendo${NC}"
echo ""

# 1. Bootstrap
test_endpoint "Bootstrap" "GET" "/bootstrap" ""

# 2. Medical Specialties
test_endpoint "Medical Specialties" "GET" "/medical-specialties" ""

# 3. Medical Specialties con refresh
test_endpoint "Medical Specialties (refresh)" "GET" "/medical-specialties?refresh=true" ""

# 4. Health check
test_endpoint "Health Check" "GET" "/health" ""

# 5. Si hay especialidades, probar obtener doctores de la primera
echo -e "${BLUE}📋 Probando endpoints que requieren parámetros...${NC}"
echo ""

# Obtener primera especialidad
first_specialty=$(curl -s "${API_URL}/medical-specialties" | jq -r '.[0].id' 2>/dev/null)

if [ -n "$first_specialty" ] && [ "$first_specialty" != "null" ] && [ "$first_specialty" != "" ]; then
    echo -e "${GREEN}✅ Especialidad encontrada: ID ${first_specialty}${NC}"
    echo ""
    
    # 6. Doctors por especialidad
    test_endpoint "Doctors por Especialidad" "GET" "/doctors/${first_specialty}" ""
    
    # 7. Appointment Types por especialidad
    test_endpoint "Appointment Types" "GET" "/appointments-types/${first_specialty}" ""
    
    # Obtener primer doctor
    first_doctor=$(curl -s "${API_URL}/doctors/${first_specialty}" | jq -r '.[0].id' 2>/dev/null)
    
    if [ -n "$first_doctor" ] && [ "$first_doctor" != "null" ] && [ "$first_doctor" != "" ]; then
        echo -e "${GREEN}✅ Doctor encontrado: ID ${first_doctor}${NC}"
        echo ""
        
        # 8. Doctor Availability
        today=$(date +%Y%m%d)
        test_endpoint "Doctor Availability" "GET" "/doctor-availability/${first_doctor}/${today}?dates_to_fetch=7" ""
    else
        echo -e "${YELLOW}⚠️  No se encontraron doctores para probar disponibilidad${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No se encontraron especialidades para probar endpoints dependientes${NC}"
fi

echo ""
echo "=================================================="
echo -e "${BLUE}📊 RESUMEN${NC}"
echo "=================================================="
echo ""
echo "✅ Endpoints probados:"
echo "   1. GET /bootstrap"
echo "   2. GET /medical-specialties"
echo "   3. GET /medical-specialties?refresh=true"
echo "   4. GET /health"
echo "   5. GET /doctors/{id} (si hay especialidades)"
echo "   6. GET /appointments-types/{id} (si hay especialidades)"
echo "   7. GET /doctor-availability/{id}/{date} (si hay doctores)"
echo ""
echo "💡 Revisa los logs del servidor para ver detalles de las llamadas a DriCloud"
echo ""


#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando servidor de desarrollo del Widget GUA...${NC}"
echo ""

# Verificar si existe .env.development
ENV_FILE=".env.development"
ENV_TEMPLATE=".env.dev"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  Archivo .env.development no encontrado${NC}"
    echo ""
    
    if [ -f "$ENV_TEMPLATE" ]; then
        echo -e "${BLUE}📋 Copiando .env.dev a .env.development...${NC}"
        cp "$ENV_TEMPLATE" "$ENV_FILE"
        echo -e "${GREEN}✅ Archivo .env.development creado${NC}"
        echo ""
        echo -e "${YELLOW}💡 IMPORTANTE: Revisa y edita .env.development con tus valores reales${NC}"
        echo ""
    else
        echo -e "${RED}❌ ERROR: No se encontró .env.development ni .env.dev${NC}"
        echo ""
        echo "Por favor, crea un archivo .env.development con:"
        echo "  VITE_GUA_SERVICE_URL=https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod"
        echo "  VITE_AES_KEY=dGVzdC1hZXMta2V5LWZvci1kZXZlbG9wbWVudA=="
        echo ""
        exit 1
    fi
else
    echo -e "${GREEN}✅ Archivo .env.development encontrado${NC}"
    
    # Verificar que tenga contenido mínimo
    if ! grep -q "VITE_GUA_SERVICE_URL" "$ENV_FILE"; then
        echo -e "${YELLOW}⚠️  ADVERTENCIA: .env.development no contiene VITE_GUA_SERVICE_URL${NC}"
        echo "   El widget usará valores por defecto que pueden no funcionar"
        echo ""
    fi
fi

echo ""
echo -e "${BLUE}📋 Configuración:${NC}"
echo "  • Puerto: 5173"
echo "  • URL: http://localhost:5173"
echo "  • Hot Reload: ✅ Activado"
echo ""

# Mostrar la URL configurada si existe
if [ -f "$ENV_FILE" ]; then
    API_URL=$(grep "^VITE_GUA_SERVICE_URL=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$API_URL" ]; then
        echo -e "  • API URL: ${GREEN}$API_URL${NC}"
    else
        echo -e "  • API URL: ${YELLOW}No configurada (usará fallback)${NC}"
    fi
fi

echo ""
echo -e "${BLUE}💡 Para cambiar la URL de la API, edita .env.development${NC}"
echo ""
echo -e "${BLUE}⏳ Iniciando servidor...${NC}"
echo ""

npm run dev


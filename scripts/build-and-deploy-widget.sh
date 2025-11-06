#!/bin/bash

# Script para construir el widget y prepararlo para WordPress
# Este script:
# 1. Hace build del widget (compila TypeScript y CSS)
# 2. Copia los archivos generados al plugin de WordPress
# 3. Opcionalmente crea el ZIP del plugin

set -e  # Salir si hay algún error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorios
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WIDGET_DIR="${ROOT_DIR}/packages/widget"
PLUGIN_DIR="${ROOT_DIR}/wordpress-plugin"
WIDGET_DIST="${WIDGET_DIR}/dist"

echo -e "${GREEN}🚀 Construyendo widget y preparándolo para WordPress...${NC}"
echo ""

# 1. Verificar que estamos en el directorio correcto
if [ ! -d "$WIDGET_DIR" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio del widget${NC}"
    exit 1
fi

# 2. Hacer build del widget
echo -e "${YELLOW}📦 Paso 1: Construyendo el widget...${NC}"
cd "$WIDGET_DIR"

if ! npm run build; then
    echo -e "${RED}❌ Error al construir el widget${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Widget construido exitosamente${NC}"
echo ""

# 3. Verificar que los archivos generados existen
echo -e "${YELLOW}📋 Paso 2: Verificando archivos generados...${NC}"

JS_FILE="${WIDGET_DIST}/gua-widget.iife.js"
CSS_FILE="${WIDGET_DIST}/style.css"

if [ ! -f "$JS_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró gua-widget.iife.js en dist/${NC}"
    exit 1
fi

if [ ! -f "$CSS_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró style.css en dist/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivos generados encontrados:${NC}"
echo "   - $(basename "$JS_FILE") ($(du -h "$JS_FILE" | cut -f1))"
echo "   - $(basename "$CSS_FILE") ($(du -h "$CSS_FILE" | cut -f1))"
echo ""

# 4. Copiar archivos al plugin de WordPress
echo -e "${YELLOW}📂 Paso 3: Copiando archivos al plugin de WordPress...${NC}"

if [ ! -d "$PLUGIN_DIR" ]; then
    echo -e "${RED}❌ Error: No se encontró el directorio del plugin de WordPress${NC}"
    exit 1
fi

# Copiar JavaScript
cp "$JS_FILE" "${PLUGIN_DIR}/gua-widget.iife.js"
echo -e "${GREEN}✅ Copiado: gua-widget.iife.js${NC}"

# Copiar CSS
cp "$CSS_FILE" "${PLUGIN_DIR}/style.css"
echo -e "${GREEN}✅ Copiado: style.css${NC}"

echo ""

# 5. Mostrar resumen
echo -e "${GREEN}✅ Proceso completado exitosamente!${NC}"
echo ""
echo "📦 Archivos listos en: ${PLUGIN_DIR}"
echo ""
echo "📋 Archivos del plugin:"
ls -lh "${PLUGIN_DIR}"/*.{js,css,php} 2>/dev/null | awk '{print "   - " $9 " (" $5 ")"}'
echo ""

# 6. Preguntar si crear el ZIP
read -p "¿Deseas crear el ZIP del plugin para WordPress? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📦 Creando ZIP del plugin...${NC}"
    cd "$PLUGIN_DIR"
    
    VERSION="v1.0.6"
    ZIP_FILE=~/Desktop/gua-clinic-widget-FINAL-${VERSION}.zip
    
    # Crear ZIP con todos los archivos necesarios
    zip -r "$ZIP_FILE" \
        gua-clinic-widget.php \
        gua-widget.iife.js \
        style.css \
        readme.txt \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ZIP creado exitosamente en:${NC}"
        echo "   $ZIP_FILE"
        echo ""
        echo "📊 Tamaño: $(du -h "$ZIP_FILE" | cut -f1)"
        echo ""
        echo "📋 Contenido del ZIP:"
        unzip -l "$ZIP_FILE" | tail -n +4 | head -n -2 | awk '{print "   - " $4 " (" $1 " bytes)"}'
    else
        echo -e "${RED}❌ Error al crear el ZIP${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 ¡Todo listo!${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Sube el ZIP a tu sitio WordPress"
echo "   2. Activa el plugin"
echo "   3. Usa el shortcode: [gua_clinic_widget]"
echo ""



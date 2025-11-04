#!/bin/bash
cd "$(dirname "$0")"
VERSION="v1.0.2"
ZIP_FILE=~/Desktop/gua-clinic-widget-FINAL-${VERSION}.zip

echo "📦 Creando ZIP del plugin WordPress..."
echo "   Versión: ${VERSION}"
echo ""

# Incluir todos los archivos necesarios (CSS incluido ahora)
zip -r "$ZIP_FILE" gua-clinic-widget.php gua-widget.iife.js style.css readme.txt

echo ""
echo "✅ ZIP creado exitosamente en $ZIP_FILE"
echo ""
ls -lh "$ZIP_FILE"
echo ""
echo "📋 Contenido del ZIP:"
unzip -l "$ZIP_FILE"



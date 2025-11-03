#!/bin/bash
cd "$(dirname "$0")"
zip -r ~/Desktop/gua-clinic-widget-FINAL-v1.0.1.zip gua-clinic-widget.php gua-widget.iife.js readme.txt
echo ""
echo "✅ ZIP creado exitosamente en ~/Desktop/gua-clinic-widget-FINAL-v1.0.1.zip"
echo ""
ls -lh ~/Desktop/gua-clinic-widget-FINAL-v1.0.1.zip
echo ""
echo "📋 Contenido del ZIP:"
unzip -l ~/Desktop/gua-clinic-widget-FINAL-v1.0.1.zip



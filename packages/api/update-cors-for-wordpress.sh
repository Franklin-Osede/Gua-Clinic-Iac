#!/bin/bash

# Script para actualizar CORS con el dominio de WordPress
# Ejecuta este script después de verificar tu dominio en WordPress

echo "🔧 ACTUALIZACIÓN DE CORS PARA WORDPRESS"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Este script te ayudará a configurar CORS para tu dominio de WordPress."
echo ""
echo "📍 Dominios actualmente configurados en CORS:"
echo "   - https://www.guaclinic.com"
echo "   - https://guaclinic.com"
echo "   - https://cdn.gua.com"
echo ""
read -p "¿Tu dominio de WordPress es guaclinic.com? (s/n): " es_guaclinic

if [ "$es_guaclinic" != "s" ] && [ "$es_guaclinic" != "S" ]; then
  echo ""
  echo "Por favor, indica tu dominio de WordPress:"
  echo "   Ejemplos:"
  echo "   - https://www.tudominio.com"
  echo "   - https://tudominio.com"
  echo "   - https://wordpress.tudominio.com"
  echo ""
  read -p "Dominio (con https://): " wordpress_domain
  
  if [ ! -z "$wordpress_domain" ]; then
    # Eliminar trailing slash si existe
    wordpress_domain=$(echo "$wordpress_domain" | sed 's|/$||')
    
    echo ""
    echo "¿Quieres agregar también la versión sin www? (s/n): "
    read -p "Si tu dominio es https://www.xxx.com, agregar https://xxx.com: " agregar_sin_www
    
    file_path="packages/api/src/main.ts"
    
    # Crear backup
    cp "$file_path" "${file_path}.backup"
    echo "✅ Backup creado: ${file_path}.backup"
    
    # Actualizar el archivo
    if [ "$agregar_sin_www" == "s" ] || [ "$agregar_sin_www" == "S" ]; then
      # Extraer dominio sin www
      dominio_sin_www=$(echo "$wordpress_domain" | sed 's|https://www\.|https://|')
      dominio_con_www="$wordpress_domain"
      
      # Agregar ambos
      sed -i.tmp "s|'https://www.guaclinic.com',|'$dominio_con_www',\n      '$dominio_sin_www',|" "$file_path"
      rm -f "${file_path}.tmp"
    else
      # Solo agregar el dominio proporcionado
      sed -i.tmp "s|'https://www.guaclinic.com',|'$wordpress_domain',|" "$file_path"
      rm -f "${file_path}.tmp"
    fi
    
    echo ""
    echo "✅ CORS actualizado en $file_path"
    echo ""
    echo "📋 Dominios configurados:"
    grep -A 5 "allowedOrigins = \[" "$file_path" | grep "https://"
    echo ""
    echo "⚠️  IMPORTANTE: Debes reconstruir y redesplegar el backend:"
    echo "   1. npm run build (si estás en desarrollo)"
    echo "   2. ./deploy-ecs.sh (para redesplegar en AWS)"
  fi
else
  echo ""
  echo "✅ Tu dominio (guaclinic.com) ya está configurado en CORS"
  echo "   No necesitas hacer cambios."
fi

echo ""
echo "💡 Para verificar tu dominio en WordPress:"
echo "   1. Ve a: WordPress Admin → Ajustes → General"
echo "   2. Busca: 'Dirección de WordPress (URL)' y 'Dirección del sitio (URL)'"
echo "   3. Esa es la URL que debe estar en CORS"


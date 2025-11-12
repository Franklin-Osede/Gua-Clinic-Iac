#!/bin/bash
# Script para subir las imágenes optimizadas de doctores al CDN (S3)
# Uso: ./upload-doctors-to-cdn.sh

# Variables (ajusta según tu configuración)
BUCKET_NAME="cdn-gua-com"  # Nombre del bucket S3
REGION="eu-north-1"        # O tu región
DOCTORS_DIR="public/doctors-optimized"
S3_PREFIX="doctors/"       # Carpeta en S3 donde se guardarán las imágenes

echo "📤 Subiendo imágenes de doctores optimizadas al CDN..."
echo "   Bucket: $BUCKET_NAME"
echo "   Región: $REGION"
echo "   Carpeta local: $DOCTORS_DIR"
echo "   Carpeta S3: $S3_PREFIX"
echo ""

# Verificar que el directorio existe
if [ ! -d "$DOCTORS_DIR" ]; then
  echo "❌ Error: No se encuentra el directorio $DOCTORS_DIR"
  echo "   Ejecuta primero: npm run optimize:images"
  exit 1
fi

# Verificar que hay imágenes
if [ -z "$(ls -A $DOCTORS_DIR/*.webp 2>/dev/null)" ]; then
  echo "❌ Error: No se encuentran imágenes .webp en $DOCTORS_DIR"
  echo "   Ejecuta primero: npm run optimize:images"
  exit 1
fi

# Contador de archivos subidos
count=0

# Subir cada archivo WebP
for file in "$DOCTORS_DIR"/*.webp; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    s3_key="${S3_PREFIX}${filename}"
    
    echo "📤 Subiendo: $filename -> s3://$BUCKET_NAME/$s3_key"
    
    # Subir a S3 con cache público y content-type correcto
    aws s3 cp "$file" "s3://$BUCKET_NAME/$s3_key" \
      --region "$REGION" \
      --content-type "image/webp" \
      --cache-control "public, max-age=31536000" \
      --acl public-read
    
    if [ $? -eq 0 ]; then
      echo "   ✅ Subido: https://cdn.gua.com/$s3_key"
      ((count++))
    else
      echo "   ❌ Error subiendo $filename"
    fi
    echo ""
  fi
done

echo "✅ Proceso completado: $count imágenes subidas"
echo ""
echo "🔗 URLs disponibles en:"
echo "   https://cdn.gua.com/$S3_PREFIX"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configura VITE_CDN_BASE_URL=https://cdn.gua.com en .env.dev"
echo "   2. Reconstruye el widget: npm run build"
echo "   3. Las imágenes se cargarán automáticamente desde el CDN"


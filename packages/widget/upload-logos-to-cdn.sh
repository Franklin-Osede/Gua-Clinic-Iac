#!/bin/bash
# Script para subir los logos de especialidades al CDN (S3)
# Uso: ./upload-logos-to-cdn.sh

# Variables (ajusta según tu configuración)
BUCKET_NAME="cdn.gua.com"  # O el nombre de tu bucket S3
REGION="eu-north-1"        # O tu región
LOGOS_DIR="src/assets/logos"
S3_PREFIX="logos/"         # Carpeta en S3 donde se guardarán los logos

echo "📤 Subiendo logos al CDN..."
echo "   Bucket: $BUCKET_NAME"
echo "   Región: $REGION"
echo "   Carpeta local: $LOGOS_DIR"
echo "   Carpeta S3: $S3_PREFIX"
echo ""

# Verificar que el directorio existe
if [ ! -d "$LOGOS_DIR" ]; then
  echo "❌ Error: No se encuentra el directorio $LOGOS_DIR"
  exit 1
fi

# Contador de archivos subidos
count=0

# Subir cada archivo SVG
for file in "$LOGOS_DIR"/*.svg; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    s3_key="${S3_PREFIX}${filename}"
    
    echo "📤 Subiendo: $filename -> s3://$BUCKET_NAME/$s3_key"
    
    # Subir a S3 con cache público y content-type correcto
    aws s3 cp "$file" "s3://$BUCKET_NAME/$s3_key" \
      --region "$REGION" \
      --content-type "image/svg+xml" \
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

echo "✅ Proceso completado: $count logos subidos"
echo ""
echo "🔗 URLs disponibles en:"
echo "   https://cdn.gua.com/logos/"







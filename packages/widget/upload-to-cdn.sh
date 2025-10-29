#!/bin/bash
# Script para subir el widget al CDN (S3)
# Ajusta las variables según tu configuración de AWS

# Variables (ajusta según tu configuración)
BUCKET_NAME="cdn.gua.com"  # O el nombre de tu bucket S3
REGION="eu-north-1"        # O tu región
FILE_PATH="dist/gua-widget.iife.js"
S3_KEY="gua-widget.js"      # Nombre del archivo en S3

# Crear copia con el nombre correcto
cp "$FILE_PATH" "dist/$S3_KEY"

# Subir a S3 con cache público y content-type correcto
aws s3 cp "dist/$S3_KEY" "s3://$BUCKET_NAME/$S3_KEY" \
  --region "$REGION" \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000" \
  --acl public-read

echo "✅ Widget subido a: https://cdn.gua.com/$S3_KEY"
echo "📦 Tamaño del archivo: $(du -h dist/$S3_KEY | cut -f1)"


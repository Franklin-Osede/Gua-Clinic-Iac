#!/bin/bash

# Script para configurar S3 + CloudFront para el widget
# Costo estimado: ~$0.50-1 USD/mes para 10,000 visitas

echo "🚀 Configurando CDN en AWS (S3 + CloudFront)..."
echo ""

BUCKET_NAME="gua-clinic-widget-cdn"
REGION="eu-north-1"
DISTRIBUTION_COMMENT="GUA Clinic Widget CDN"

# 1. Crear bucket S3
echo "1️⃣ Creando bucket S3: $BUCKET_NAME"
aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" \
  2>/dev/null || echo "   ⚠️  Bucket ya existe o hubo error (verificando...)"

# Verificar que el bucket existe
if aws s3 ls "s3://$BUCKET_NAME" > /dev/null 2>&1; then
  echo "   ✅ Bucket existe"
else
  echo "   ❌ Error creando bucket"
  exit 1
fi

# 2. Configurar bucket para hosting estático
echo ""
echo "2️⃣ Configurando políticas del bucket..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
    }
  ]
}" 2>/dev/null || echo "   ⚠️  Política ya configurada"

aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration "{
  \"CORSRules\": [
    {
      \"AllowedOrigins\": [\"*\"],
      \"AllowedMethods\": [\"GET\", \"HEAD\"],
      \"AllowedHeaders\": [\"*\"],
      \"MaxAgeSeconds\": 3000
    }
  ]
}" 2>/dev/null || echo "   ⚠️  CORS ya configurado"

# 3. Subir widget al bucket
echo ""
echo "3️⃣ Subiendo widget al bucket..."
if [ ! -f "dist/gua-widget.iife.js" ]; then
  echo "   ❌ Archivo dist/gua-widget.iife.js no encontrado"
  echo "   Ejecuta: npm run build"
  exit 1
fi

aws s3 cp "dist/gua-widget.iife.js" "s3://$BUCKET_NAME/gua-widget.js" \
  --region "$REGION" \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000" \
  --acl public-read

if [ $? -eq 0 ]; then
  echo "   ✅ Widget subido exitosamente"
else
  echo "   ❌ Error subiendo widget"
  exit 1
fi

# 4. Crear CloudFront Distribution (opcional pero recomendado)
echo ""
echo "4️⃣ Configurando CloudFront Distribution..."
echo "   ⚠️  Esto puede tardar 10-15 minutos..."
echo "   💡 Puedes hacerlo manualmente desde la consola AWS:"
echo "      https://console.aws.amazon.com/cloudfront/"
echo ""
echo "   Configuración recomendada:"
echo "   - Origin: s3://$BUCKET_NAME"
echo "   - Viewer Protocol Policy: Redirect HTTP to HTTPS"
echo "   - Cache Policy: CachingOptimized"
echo "   - Origin Request Policy: CORS-S3Origin"
echo ""

# URL directa del bucket (temporal, sin CloudFront)
BUCKET_URL="https://$BUCKET_NAME.s3.$REGION.amazonaws.com/gua-widget.js"
echo "✅ Widget disponible temporalmente en:"
echo "   $BUCKET_URL"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Configura CloudFront manualmente (opcional pero recomendado)"
echo "   2. Actualiza la URL en el plugin WordPress (línea 32):"
echo "      'https://$BUCKET_NAME.s3.$REGION.amazonaws.com/gua-widget.js'"
echo ""
echo "💰 Costo estimado:"
echo "   - S3 Storage: ~$0.0001/mes (archivo de 1.5 MB)"
echo "   - Transferencia: ~$0.02 por GB"
echo "   - 10,000 visitas/mes (~15 GB): ~$0.30/mes"
echo "   - TOTAL: Menos de $1 USD/mes incluso con mucho tráfico"
echo ""


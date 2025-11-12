# Guía: Configurar Cloudflare R2 para Imágenes de Doctores

## ¿Por qué Cloudflare R2?

- ✅ **Gratis hasta 10GB** de almacenamiento
- ✅ **Sin costos de transferencia** (egress) - a diferencia de AWS S3
- ✅ **Compatible con S3 API** - fácil de usar
- ✅ **CDN global** incluido
- ✅ **Configuración rápida** (15 minutos)

## Paso 1: Optimizar Imágenes

Antes de subir, optimiza las imágenes para reducir el tamaño:

```bash
# Instalar dependencia
npm install -D sharp

# Ejecutar optimización
npm run optimize:images
```

Esto creará imágenes optimizadas en `public/doctors-optimized/` (de ~12MB a ~200-500KB cada una).

## Paso 2: Crear Cuenta en Cloudflare R2

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Crea una cuenta (gratis) si no tienes una
3. Ve a **R2** en el menú lateral

## Paso 3: Crear Bucket R2

1. Click en **"Create bucket"**
2. Nombre: `gua-clinic-assets` (o el que prefieras)
3. Location: Elige la más cercana (ej: `Europe (Warsaw)`)
4. Click **"Create bucket"**

## Paso 4: Configurar API Token

1. Ve a **Manage R2 API Tokens**
2. Click **"Create API token"**
3. Configuración:
   - **Token name**: `gua-clinic-upload`
   - **Permissions**: `Object Read & Write`
   - **Bucket**: Selecciona tu bucket
4. Click **"Create API Token"**
5. **Guarda** el `Access Key ID` y `Secret Access Key` (solo se muestran una vez)

## Paso 5: Subir Imágenes

### Opción A: Usando AWS CLI (recomendado)

Cloudflare R2 es compatible con S3 API, así que puedes usar `aws-cli`:

```bash
# Instalar AWS CLI si no lo tienes
# macOS: brew install awscli
# Linux: sudo apt install awscli

# Configurar credenciales
aws configure --profile r2
# Access Key ID: [tu access key]
# Secret Access Key: [tu secret key]
# Default region: auto (o cualquier valor)
# Default output format: json

# Configurar endpoint de R2
export R2_ACCOUNT_ID="tu-account-id"  # Lo encuentras en R2 Dashboard
export R2_BUCKET="gua-clinic-assets"

# Subir imágenes optimizadas
aws s3 cp public/doctors-optimized/ s3://${R2_BUCKET}/doctors/ \
  --profile r2 \
  --endpoint-url https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com \
  --recursive
```

### Opción B: Usando Script Node.js

Crea un script `upload-to-r2.js`:

```javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET = process.env.R2_BUCKET || 'gua-clinic-assets';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

async function uploadFile(filePath, key) {
  const fileContent = await fs.readFile(filePath);
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: 'image/webp',
  });
  
  await s3Client.send(command);
  console.log(`✅ Subido: ${key}`);
}

// Subir todas las imágenes
const imagesDir = './public/doctors-optimized';
const files = await fs.readdir(imagesDir);
const imageFiles = files.filter(f => f.endsWith('.webp'));

for (const file of imageFiles) {
  const filePath = path.join(imagesDir, file);
  const key = `doctors/${file}`;
  await uploadFile(filePath, key);
}

console.log('✅ Todas las imágenes subidas');
```

Ejecutar:
```bash
npm install -D @aws-sdk/client-s3
R2_ACCOUNT_ID=tu-id R2_ACCESS_KEY=tu-key R2_SECRET_KEY=tu-secret node upload-to-r2.js
```

## Paso 6: Obtener URL Pública

1. En R2 Dashboard, ve a tu bucket
2. Click en una imagen
3. Ve a **"Public URL"** o configura un **Custom Domain**
4. La URL será algo como: `https://pub-xxxxx.r2.dev/doctors/imagen.webp`

### Configurar Custom Domain (Opcional pero recomendado)

1. En R2 Dashboard, ve a **Settings** → **Public Access**
2. Click **"Connect Domain"**
3. Elige un subdominio (ej: `assets.tudominio.com`)
4. Cloudflare configurará automáticamente el DNS

## Paso 7: Configurar en el Widget

### Opción A: Variable de Entorno

Agrega a `.env.dev`:

```bash
VITE_CDN_BASE_URL=https://pub-xxxxx.r2.dev
# O si usas custom domain:
# VITE_CDN_BASE_URL=https://assets.tudominio.com
```

### Opción B: Atributo del Widget (Futuro)

El código ya está preparado para aceptar `cdn-url`:

```html
<gua-widget 
  base-url="https://api.tudominio.com"
  cdn-url="https://assets.tudominio.com"
></gua-widget>
```

## Paso 8: Actualizar Rutas de Imágenes

Las imágenes optimizadas tienen extensión `.webp`. Actualiza `doctorImages.ts` si es necesario:

```typescript
// Cambiar extensiones de .png/.jpg a .webp
export const doctorImageMap: Record<number, string> = {
  50: '/doctors/50.webp',  // Era .png
  63: '/doctors/63.webp',  // Era .png
  // ...
};
```

## Paso 9: Reconstruir Widget

```bash
npm run build
```

## Costos

- **Almacenamiento**: Gratis hasta 10GB
- **Transferencia**: Gratis (sin límite)
- **Requests**: Gratis hasta 10M requests/mes
- **Total**: **$0/mes** para tu caso de uso

## Ventajas vs AWS S3 + CloudFront

| Característica | Cloudflare R2 | AWS S3 + CloudFront |
|----------------|---------------|---------------------|
| Almacenamiento | Gratis 10GB | ~$0.023/GB |
| Transferencia | **Gratis** | ~$0.085/GB |
| Requests | Gratis 10M | ~$0.005/10K |
| CDN | Incluido | Incluido |
| Configuración | Simple | Más complejo |

## Troubleshooting

### Error: "Access Denied"
- Verifica que el API token tenga permisos `Object Read & Write`
- Verifica que el bucket esté configurado correctamente

### Error: "Endpoint not found"
- Verifica que `R2_ACCOUNT_ID` sea correcto
- El endpoint debe ser: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`

### Las imágenes no cargan
- Verifica que el bucket tenga **Public Access** habilitado
- Verifica que la URL del CDN sea correcta en `VITE_CDN_BASE_URL`

## Siguiente Paso

Una vez configurado, las imágenes se cargarán desde Cloudflare R2 automáticamente. No necesitas cambiar nada más en el código.


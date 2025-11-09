# 🛡️ Cómo Verificar WAF Manualmente

## Método 1: Usando el Script Automático

Ejecuta el script de verificación:

```bash
cd packages/api
./verify-waf.sh
```

Este script verificará automáticamente si el WAF está configurado y asociado a tu ALB.

---

## Método 2: Verificación Manual en AWS Console

### Paso 1: Acceder a WAF Console

1. Abre AWS Console: https://console.aws.amazon.com/
2. Asegúrate de estar en la región: **eu-north-1** (Estocolmo)
3. Busca "WAF" en la barra de búsqueda
4. Ve a: **AWS WAF** → **Web ACLs**

**URL Directa:**
```
https://console.aws.amazon.com/wafv2/home?region=eu-north-1#/webacls
```

### Paso 2: Verificar Web ACLs Existentes

1. En la lista de Web ACLs, busca alguno que contenga:
   - Nombre relacionado con "gua-clinic"
   - O cualquier Web ACL con scope **REGIONAL**

2. Si encuentras uno:
   - Haz clic en el nombre del Web ACL
   - Ve a la pestaña **"Associated AWS resources"**
   - Verifica si tu ALB (`gua-clinic-api-alb`) está listado

### Paso 3: Verificar Asociación desde el ALB

1. Ve a **EC2 Console** → **Load Balancers**
2. Busca: `gua-clinic-api-alb`
3. Haz clic en el nombre del ALB
4. Ve a la pestaña **"Integrated services"**
5. Si WAF está configurado, verás:
   - **AWS WAF** con el nombre del Web ACL asociado

**URL Directa:**
```
https://console.aws.amazon.com/ec2/v2/home?region=eu-north-1#LoadBalancers:
```

---

## Método 3: Usando AWS CLI

### Verificar si hay WAF asociado al ALB:

```bash
# Obtener ARN del ALB
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names gua-clinic-api-alb \
  --region eu-north-1 \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Verificar WAF asociado
aws wafv2 get-web-acl-for-resource \
  --resource-arn "$ALB_ARN" \
  --region eu-north-1
```

### Listar todos los Web ACLs:

```bash
aws wafv2 list-web-acls \
  --scope REGIONAL \
  --region eu-north-1
```

---

## ¿Qué Buscar?

### ✅ Si WAF está Configurado Correctamente:

Deberías ver:
- Un Web ACL con nombre relacionado a "gua-clinic" o similar
- El Web ACL asociado al ALB `gua-clinic-api-alb`
- Reglas como:
  - **AWSManagedRulesCommonRuleSet** (protección OWASP Top 10)
  - **Rate limiting rule** (límite de requests por IP)

### ❌ Si WAF NO está Configurado:

No verás:
- Ningún Web ACL asociado al ALB
- Ninguna mención de WAF en la pestaña "Integrated services" del ALB

---

## Si NO está Configurado: Cómo Crearlo

### Opción 1: Usando AWS Console

1. Ve a: https://console.aws.amazon.com/wafv2/home?region=eu-north-1#/webacls
2. Haz clic en **"Create web ACL"**
3. Configura:
   - **Name:** `gua-clinic-waf`
   - **Resource type:** Regional resources (Application Load Balancer)
   - **Region:** eu-north-1
4. En **"Associated AWS resources"**, selecciona tu ALB: `gua-clinic-api-alb`
5. En **"Add rules"**, agrega:
   - **AWS Managed Rules** → **Common Rule Set**
   - **Rate-based rule** → Límite: 2000 requests por IP
6. **Default action:** Allow
7. Crea el Web ACL

### Opción 2: Usando el Script

El script `implement-infrastructure-improvements.sh` intenta crear el WAF automáticamente, pero puede fallar si:
- Ya existe un Web ACL con ese nombre
- Hay problemas de permisos IAM
- El ALB no está disponible

En ese caso, créalo manualmente usando la Opción 1.

---

## Verificación Rápida

**Comando rápido para verificar:**

```bash
cd packages/api
./verify-waf.sh
```

Este script te dirá inmediatamente si el WAF está configurado o no.

---

## Costos

- **WAF:** ~$5/mes base + $1 por millón de requests
- Para un tráfico moderado: ~$5-10/mes

---

## Beneficios de Tener WAF

✅ Protección contra OWASP Top 10  
✅ Rate limiting automático  
✅ Protección DDoS básica  
✅ Bloqueo de patrones de ataque comunes  
✅ Métricas y logs de seguridad  

---

## Próximos Pasos

1. Ejecuta `./verify-waf.sh` para verificar automáticamente
2. Si no está configurado, créalo usando AWS Console o el script
3. Verifica las métricas en CloudWatch después de unos días
4. Ajusta las reglas según sea necesario


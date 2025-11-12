# Explicación de Scripts y Archivos - Proyecto GUA Clinic

## Resumen

Este documento explica todos los scripts, archivos de configuración e archivos importantes en el proyecto GUA Clinic, su propósito y cuándo usarlos.

**Nota:** Este documento está escrito en lenguaje simple para que personas no técnicas puedan entenderlo.

---

## Scripts de Infraestructura

### `packages/api/implement-infrastructure-improvements.sh`

**Propósito:** Script de un solo comando para implementar todas las mejoras de infraestructura AWS.

**¿Qué hace?**
- Configura escalado automático (mín: 2, máx: 10)
- Habilita Deployment Circuit Breaker
- Habilita Container Insights
- Habilita Recuperación Punto en el Tiempo para DynamoDB
- Crea alarmas CloudWatch (CPU, Memoria, Salud de Objetivos)
- Configura WAF (si es posible)
- Crea VPC Endpoints

**¿Cuándo usarlo?**
- Configuración inicial de infraestructura
- Después de crear nuevos recursos AWS
- Para asegurar que todas las mejores prácticas estén implementadas

**Uso:**
```bash
cd packages/api
./implement-infrastructure-improvements.sh
```

**Analogía Simple:**
Como un "botón mágico" que configura todo automáticamente. En lugar de hacer 10 cosas manualmente, ejecutas este script y todo se configura.

---

### `packages/api/setup-waf.sh`

**Propósito:** Configura AWS WAF (Firewall de Aplicaciones Web) para el ALB.

**¿Qué hace?**
- Crea Web ACL de WAF con reglas de seguridad
- Asocia WAF con Application Load Balancer
- Configura 3 reglas de protección:
  - Protección OWASP Top 10
  - Detección de entradas maliciosas conocidas
  - Limitación de velocidad (2000 solicitudes/IP)

**¿Cuándo usarlo?**
- Configuración inicial de WAF
- Después de crear un nuevo ALB
- Para actualizar configuración de WAF

**Uso:**
```bash
cd packages/api
./setup-waf.sh
```

**Analogía Simple:**
Como instalar un sistema de seguridad en tu casa. Este script instala y configura todas las cámaras y alarmas.

---

### `packages/api/verify-waf.sh`

**Propósito:** Verifica la configuración de WAF y asociación con ALB.

**¿Qué hace?**
- Verifica si WAF está asociado con ALB
- Lista todos los Web ACLs en la región
- Muestra reglas y configuración de WAF
- Proporciona estado de verificación

**¿Cuándo usarlo?**
- Después de configurar WAF para verificar que funciona
- Solucionando problemas de WAF
- Auditorías regulares de infraestructura

**Uso:**
```bash
cd packages/api
./verify-waf.sh
```

**Analogía Simple:**
Como revisar que todas las cámaras de seguridad estén funcionando correctamente.

---

### `packages/api/verify-aws-infrastructure.sh`

**Propósito:** Verificación integral de todos los componentes de infraestructura AWS.

**¿Qué hace?**
- Verifica estado del servicio ECS
- Verifica configuración de ALB
- Verifica configuración de API Gateway
- Verifica alarmas CloudWatch
- Verifica tablas DynamoDB
- Verifica VPC endpoints
- Verifica configuración de escalado automático

**¿Cuándo usarlo?**
- Auditorías de infraestructura
- Después de cambios en infraestructura
- Solucionando problemas de infraestructura
- Antes de despliegues a producción

**Uso:**
```bash
cd packages/api
./verify-aws-infrastructure.sh
```

**Analogía Simple:**
Como una inspección completa de tu casa. Revisa que todo esté funcionando correctamente.

---

## Scripts de Despliegue

### `packages/api/deploy-ecs.sh`

**Propósito:** Despliega la API a ECS Fargate.

**¿Qué hace?**
- Construye imagen Docker
- Sube imagen a ECR
- Actualiza servicio ECS con nueva imagen
- Espera a que el despliegue se complete
- Verifica éxito del despliegue

**¿Cuándo usarlo?**
- Desplegando nuevas versiones de API
- Después de cambios en código
- Despliegues a producción

**Uso:**
```bash
cd packages/api
./deploy-ecs.sh
```

**Analogía Simple:**
Como actualizar una aplicación en tu teléfono. Este script toma tu nuevo código, lo empaqueta, lo sube y lo activa.

---

### `packages/api/deploy-ecs-simple.sh`

**Propósito:** Script de despliegue ECS simplificado.

**¿Qué hace?**
- Despliegue rápido sin verificación extensiva
- Más rápido para despliegues de desarrollo

**¿Cuándo usarlo?**
- Despliegues de desarrollo/staging
- Iteraciones rápidas

**Uso:**
```bash
cd packages/api
./deploy-ecs-simple.sh
```

**Analogía Simple:**
Versión rápida del script de despliegue. Como "actualizar ahora" vs "actualizar y verificar todo".

---

## Scripts de Monitoreo y Depuración

### `packages/api/check-ecs-status.sh`

**Propósito:** Verifica el estado actual del servicio ECS.

**¿Qué hace?**
- Muestra conteo de tareas corriendo
- Muestra estado de salud de tareas
- Muestra estado de despliegue
- Lista ARNs de tareas

**¿Cuándo usarlo?**
- Verificación rápida de estado
- Solucionando problemas de despliegue
- Verificando salud del servicio

**Uso:**
```bash
cd packages/api
./check-ecs-status.sh
```

**Analogía Simple:**
Como verificar el estado de salud de tus servidores. Te dice cuántos están corriendo y si están saludables.

---

### `packages/api/view-cloudwatch-logs.sh`

**Propósito:** Ve registros de CloudWatch para el servicio ECS.

**¿Qué hace?**
- Obtiene registros recientes de CloudWatch
- Filtra registros por rango de tiempo
- Muestra registros de error
- Muestra flujos de registro

**¿Cuándo usarlo?**
- Depurando errores de aplicación
- Investigando problemas de producción
- Monitoreando comportamiento de aplicación

**Uso:**
```bash
cd packages/api
./view-cloudwatch-logs.sh
```

**Analogía Simple:**
Como revisar el registro de eventos de tu aplicación. Te muestra qué está pasando y si hay errores.

---

### `packages/api/check-error-logs.sh`

**Propósito:** Específicamente verifica registros de error en CloudWatch.

**¿Qué hace?**
- Filtra registros para errores
- Muestra patrones de error
- Muestra errores recientes
- Resalta errores críticos

**¿Cuándo usarlo?**
- Verificación rápida de errores
- Monitoreando tasas de error
- Depurando problemas

**Uso:**
```bash
cd packages/api
./check-error-logs.sh
```

**Analogía Simple:**
Como un detector de problemas. Solo te muestra los errores, no toda la información.

---

### `packages/api/check-api-gateway-config.sh`

**Propósito:** Verifica configuración de API Gateway.

**¿Qué hace?**
- Verifica endpoints de API Gateway
- Verifica rutas
- Verifica configuración CORS
- Valida integraciones

**¿Cuándo usarlo?**
- Después de cambios en API Gateway
- Solucionando problemas de API
- Verificando configuración de endpoints

**Uso:**
```bash
cd packages/api
./check-api-gateway-config.sh
```

**Analogía Simple:**
Como verificar que todas las puertas de tu casa estén configuradas correctamente.

---

## Scripts de Pruebas

### `packages/api/test-availability.sh`

**Propósito:** Prueba el endpoint de API de disponibilidad de doctores.

**¿Qué hace?**
- Hace solicitudes de prueba al endpoint de disponibilidad
- Valida respuestas
- Verifica tiempos de respuesta
- Verifica formato de datos

**¿Cuándo usarlo?**
- Probando funcionalidad de disponibilidad
- Después de cambios en código
- Pruebas de integración

**Uso:**
```bash
cd packages/api
./test-availability.sh
```

**Analogía Simple:**
Como probar que un teléfono funcione haciendo una llamada de prueba.

---

### `packages/api/test-dricloud-availability.sh`

**Propósito:** Prueba conexión directa a API de DriCloud.

**¿Qué hace?**
- Prueba conectividad de API de DriCloud
- Valida credenciales
- Verifica formato de respuesta
- Verifica recuperación de datos

**¿Cuándo usarlo?**
- Solucionando problemas de integración DriCloud
- Verificando credenciales
- Probando conectividad de API externa

**Uso:**
```bash
cd packages/api
./test-dricloud-availability.sh
```

**Analogía Simple:**
Como verificar que puedas conectarte a internet. Prueba la conexión con un servicio externo.

---

### `packages/api/check-doctors-availability.sh`

**Propósito:** Verifica datos de disponibilidad de doctores.

**¿Qué hace?**
- Obtiene disponibilidad de doctores
- Valida estructura de datos
- Verifica datos faltantes
- Verifica rangos de fechas

**¿Cuándo usarlo?**
- Validación de datos
- Solucionando problemas de disponibilidad
- Verificaciones de calidad de datos

**Uso:**
```bash
cd packages/api
./check-doctors-availability.sh
```

**Analogía Simple:**
Como verificar que una lista de contactos esté completa y correcta.

---

## Scripts de Configuración

### `packages/api/setup-secrets.sh`

**Propósito:** Configura AWS Secrets Manager con credenciales de DriCloud.

**¿Qué hace?**
- Crea secretos en Secrets Manager
- Almacena credenciales de DriCloud de forma segura
- Configura permisos IAM
- Verifica creación de secretos

**¿Cuándo usarlo?**
- Configuración inicial
- Actualizando credenciales
- Configurando nuevos entornos

**Uso:**
```bash
cd packages/api
./setup-secrets.sh
```

**Analogía Simple:**
Como guardar tus contraseñas en un administrador de contraseñas seguro.

---

### `packages/api/setup-api-gateway.sh`

**Propósito:** Configura configuración de API Gateway.

**¿Qué hace?**
- Crea endpoints de API Gateway
- Configura rutas
- Configura CORS
- Configura integraciones

**¿Cuándo usarlo?**
- Configuración inicial de API Gateway
- Agregando nuevos endpoints
- Actualizando configuración de API

**Uso:**
```bash
cd packages/api
./setup-api-gateway.sh
```

**Analogía Simple:**
Como configurar las rutas de tu GPS. Define cómo llegar a diferentes lugares.

---

### `packages/api/migrate-to-http-api-v2.sh`

**Propósito:** Migra de REST API v1 a HTTP API v2.

**¿Qué hace?**
- Crea HTTP API v2
- Migra rutas
- Actualiza integraciones
- Verifica migración

**¿Cuándo usarlo?**
- Migrando a HTTP API v2
- Actualizando API Gateway

**Uso:**
```bash
cd packages/api
./migrate-to-http-api-v2.sh
```

**Analogía Simple:**
Como actualizar de una versión antigua de software a una nueva.

---

## Scripts de Diagnóstico

### `packages/api/diagnose-504-timeout.sh`

**Propósito:** Diagnostica errores de timeout 504.

**¿Qué hace?**
- Verifica salud de objetivos de ALB
- Verifica estado de tareas ECS
- Verifica configuración de API Gateway
- Identifica causas de timeout

**¿Cuándo usarlo?**
- Solucionando errores 504
- Investigando problemas de timeout
- Depuración de rendimiento

**Uso:**
```bash
cd packages/api
./diagnose-504-timeout.sh
```

**Analogía Simple:**
Como un médico que diagnostica por qué algo no está funcionando. Encuentra la causa del problema.

---

### `packages/api/find-missing-integrations.sh`

**Propósito:** Encuentra integraciones faltantes de API Gateway.

**¿Qué hace?**
- Escanea rutas de API Gateway
- Identifica integraciones faltantes
- Lista endpoints no configurados
- Sugiere correcciones

**¿Cuándo usarlo?**
- Después de cambios en API Gateway
- Solucionando problemas de enrutamiento
- Verificando configuración de endpoints

**Uso:**
```bash
cd packages/api
./find-missing-integrations.sh
```

**Analogía Simple:**
Como encontrar direcciones faltantes en un mapa. Identifica qué está incompleto.

---

## Archivos de Configuración

### `packages/api/waf-rules.json`

**Propósito:** Archivo de configuración de reglas WAF.

**¿Qué contiene?**
- Reglas de protección OWASP Top 10
- Detección de entradas maliciosas conocidas
- Configuración de limitación de velocidad

**¿Cuándo modificarlo?**
- Actualizando reglas de WAF
- Agregando nuevas reglas de protección
- Ajustando límites de velocidad

**Analogía Simple:**
Como un manual de reglas de seguridad. Define qué está permitido y qué está bloqueado.

---

### `packages/api/Dockerfile`

**Propósito:** Definición de imagen Docker para la API.

**¿Qué contiene?**
- Imagen base (Node.js)
- Dependencias de aplicación
- Instrucciones de construcción
- Configuración de tiempo de ejecución

**¿Cuándo modificarlo?**
- Agregando nuevas dependencias
- Cambiando versión de Node.js
- Actualizando proceso de construcción

**Analogía Simple:**
Como una receta de cocina. Define cómo construir tu aplicación paso a paso.

---

### `packages/api/package.json`

**Propósito:** Configuración de proyecto Node.js.

**¿Qué contiene?**
- Dependencias
- Scripts
- Metadatos de proyecto
- Configuración de construcción

**¿Cuándo modificarlo?**
- Agregando dependencias
- Actualizando versiones de paquetes
- Agregando nuevos scripts

**Analogía Simple:**
Como una lista de compras y recetas. Define qué necesitas y qué puedes hacer.

---

## Scripts de Widget

### `packages/widget/start-dev.sh`

**Propósito:** Inicia el servidor de desarrollo del widget.

**¿Qué hace?**
- Inicia servidor dev de Vite
- Configura entorno
- Configura recarga en caliente

**¿Cuándo usarlo?**
- Desarrollo local del widget
- Probando cambios en widget

**Uso:**
```bash
cd packages/widget
./start-dev.sh
```

**Analogía Simple:**
Como encender tu computadora de desarrollo. Te permite trabajar en el widget localmente.

---

### `packages/widget/test-widget.sh`

**Propósito:** Prueba la construcción y funcionalidad del widget.

**¿Qué hace?**
- Construye widget
- Ejecuta pruebas
- Valida salida
- Verifica errores

**¿Cuándo usarlo?**
- Antes de despliegue
- Después de cambios en código
- Pipeline CI/CD

**Uso:**
```bash
cd packages/widget
./test-widget.sh
```

**Analogía Simple:**
Como probar un automóvil antes de venderlo. Verifica que todo funcione correctamente.

---

## Scripts de Utilidad

### `packages/api/get-api-url.sh`

**Propósito:** Obtiene la URL de API Gateway.

**¿Qué hace?**
- Consulta API Gateway
- Extrae URL de API
- Muestra endpoint

**¿Cuándo usarlo?**
- Encontrando endpoint de API
- Configuración
- Pruebas

**Uso:**
```bash
cd packages/api
./get-api-url.sh
```

**Analogía Simple:**
Como buscar la dirección de tu casa en un mapa. Te da la ubicación exacta.

---

### `packages/api/ejecutar-debug.sh`

**Propósito:** Ejecuta comandos de depuración.

**¿Qué hace?**
- Ejecuta scripts de depuración
- Muestra información de depuración
- Ayuda en solución de problemas

**¿Cuándo usarlo?**
- Depurando problemas
- Desarrollo

**Uso:**
```bash
cd packages/api
./ejecutar-debug.sh
```

**Analogía Simple:**
Como un modo de diagnóstico. Te ayuda a encontrar problemas.

---

## Archivos de Documentación

### `docs/infrastructure/INFRASTRUCTURE_VERIFICATION_REPORT.md`

**Propósito:** Informe completo de auditoría de infraestructura.

**¿Qué contiene?**
- Estado actual de infraestructura
- Configuraciones de servicios
- Recomendaciones
- Estimaciones de costos

**¿Cuándo leerlo?**
- Entendiendo infraestructura
- Planificando mejoras
- Auditando infraestructura

---

### `docs/infrastructure/AWS_SERVICES_EXPLANATION_ES.md`

**Propósito:** Explicación de todos los servicios AWS utilizados.

**¿Qué contiene?**
- Descripciones de servicios
- Por qué se usa cada servicio
- Cómo trabajan juntos los servicios
- Beneficios de cada servicio

**¿Cuándo leerlo?**
- Aprendiendo sobre infraestructura
- Incorporando nuevos miembros del equipo
- Entendiendo decisiones de arquitectura

---

### `docs/infrastructure/COMO_VERIFICAR_WAF.md`

**Propósito:** Guía para verificar configuración de WAF.

**¿Qué contiene?**
- Pasos de verificación de WAF
- Instrucciones de AWS Console
- Comandos CLI
- Consejos de solución de problemas

**¿Cuándo leerlo?**
- Verificando configuración de WAF
- Solucionando problemas de WAF
- Mantenimiento de WAF

---

## Resumen

### Scripts de Infraestructura
- Scripts de configuración y configuración
- Scripts de verificación y auditoría
- Mejoras de infraestructura de un comando

### Scripts de Despliegue
- Automatización de despliegue ECS
- Construcción y carga de imágenes
- Verificación de despliegue

### Scripts de Monitoreo
- Verificaciones de estado
- Visualización de registros
- Detección de errores
- Verificación de salud

### Scripts de Pruebas
- Pruebas de endpoints de API
- Pruebas de integración
- Validación de datos

### Archivos de Configuración
- Configuración Docker
- Reglas WAF
- Dependencias de paquetes
- Configuración de entorno

Todos los scripts están diseñados para ser:
- **Idempotentes:** Pueden ejecutarse múltiples veces de forma segura
- **Documentados:** Incluyen comentarios e instrucciones de uso
- **Manejo de errores:** Verifican errores y proporcionan retroalimentación
- **Verificación:** Verifican que las operaciones se completaron exitosamente







# Explicación de Servicios AWS - Infraestructura GUA Clinic

## Resumen

Este documento explica cada servicio de AWS utilizado en la infraestructura de GUA Clinic, por qué fue elegido, y cómo contribuye a la resistencia, seguridad y rendimiento del sistema.

**Nota:** Este documento está escrito en lenguaje simple para que personas no técnicas puedan entenderlo.

---

## Servicios de Infraestructura Principal

### 1. ECS (Elastic Container Service) Fargate

**¿Qué es?**
ECS Fargate es un servicio que ejecuta aplicaciones en "contenedores" (como cajas que contienen todo lo necesario para que la aplicación funcione) sin necesidad de administrar servidores.

**¿Por qué lo usamos?**
- **Sin administración de servidores:** No necesitamos comprar, configurar o mantener computadoras físicas
- **Escalado automático:** Los contenedores se multiplican automáticamente cuando hay mucha demanda
- **Económico:** Solo pagamos por los contenedores que están corriendo
- **Alta disponibilidad:** Automáticamente distribuye los contenedores en diferentes ubicaciones geográficas

**Analogía Simple:**
Imagina que tu aplicación es una pizza. ECS Fargate es como un restaurante que automáticamente:
- Prepara más pizzas cuando hay muchos clientes
- Cierra algunas cocinas cuando no hay clientes (para ahorrar)
- Si una cocina se rompe, usa otra automáticamente

**Cómo funciona:**
- Nuestra API (aplicación) corre dentro de contenedores Docker
- ECS administra el ciclo de vida de estos contenedores
- Se integra con el Balanceador de Carga para distribuir el tráfico

**Beneficios:**
- Despliegues sin tiempo de inactividad
- Reemplazo automático de contenedores si fallan
- Escalado fácil basado en métricas de CPU/memoria

---

### 2. Application Load Balancer (ALB)

**¿Qué es?**
ALB es como un "repartidor inteligente" que distribuye las solicitudes de los usuarios entre múltiples servidores.

**¿Por qué lo usamos?**
- **Alta disponibilidad:** Distribuye el tráfico entre múltiples contenedores en diferentes ubicaciones
- **Verificaciones de salud:** Solo envía tráfico a servidores que están funcionando correctamente
- **Manejo de certificados SSL:** Se encarga de la seguridad HTTPS automáticamente
- **Flexibilidad:** Puede enviar diferentes tipos de solicitudes a diferentes servicios

**Analogía Simple:**
Imagina un restaurante con múltiples cocinas. El ALB es como el maître que:
- Decide a qué cocina enviar cada orden
- Solo envía órdenes a cocinas que están funcionando
- Si una cocina se rompe, automáticamente deja de enviarle órdenes

**Cómo funciona:**
- Recibe todas las solicitudes entrantes desde API Gateway
- Enruta las solicitudes a contenedores ECS saludables
- Realiza verificaciones de salud cada 30 segundos
- Elimina automáticamente servidores no saludables de la rotación

**Beneficios:**
- Punto de entrada único para todas las solicitudes de API
- Fallback automático si un contenedor se vuelve no saludable
- Terminación SSL/TLS reduce la carga en los contenedores

---

### 3. API Gateway (HTTP API v2)

**¿Qué es?**
API Gateway es como un "receptor central" que proporciona una única dirección para acceder a todos los servicios.

**¿Por qué lo usamos?**
- **Punto de entrada único:** Proporciona una dirección unificada para todos los clientes
- **Gestión de CORS:** Maneja solicitudes de diferentes orígenes de forma segura
- **Limitación de velocidad:** Protección incorporada contra abuso
- **Integración:** Se integra perfectamente con ALB y otros servicios AWS

**Analogía Simple:**
Imagina que tu API es un edificio de oficinas. API Gateway es como:
- El recepcionista principal que recibe a todos los visitantes
- Les da direcciones a dónde ir
- Verifica que tengan permiso para entrar

**Cómo funciona:**
- Recibe solicitudes de clientes (widget, plugin de WordPress)
- Enruta las solicitudes al ALB
- Maneja CORS, autenticación y transformación de solicitudes/respuestas

**Beneficios:**
- Endpoint de API consistente independientemente de cambios en el backend
- Características de seguridad incorporadas
- Fácil agregar autenticación/autorización en el futuro

---

### 4. DynamoDB

**¿Qué es?**
DynamoDB es una base de datos que almacena información de forma muy rápida y que se escala automáticamente.

**¿Por qué lo usamos?**
- **Rendimiento rápido:** Respuestas en milisegundos
- **Escalado automático:** Se expande automáticamente con el tráfico
- **Sin administración:** No necesitamos administrar la base de datos
- **Soporte TTL:** Eliminación automática de datos antiguos para caché

**Analogía Simple:**
Imagina DynamoDB como un archivador súper inteligente que:
- Encuentra cualquier documento en milisegundos
- Automáticamente agrega más cajones cuando necesitas más espacio
- Automáticamente elimina documentos viejos según reglas que defines

**Cómo funciona:**
- **Tabla de auditoría:** Almacena todas las solicitudes y respuestas de API para auditoría (expira en 30 días)
- **Tabla de caché:** Almacena datos frecuentemente accedidos de DriCloud (expira en 5-10 minutos)

**Beneficios:**
- Reduce la carga en la API de DriCloud al almacenar respuestas en caché
- Registro completo de auditoría para cumplimiento y depuración
- Limpieza automática de datos antiguos mediante TTL

---

### 5. Secrets Manager

**¿Qué es?**
Secrets Manager es como una caja fuerte digital para guardar contraseñas y credenciales de forma segura.

**¿Por qué lo usamos?**
- **Seguridad:** Las credenciales nunca se almacenan en código o variables de entorno
- **Rotación automática:** Puede cambiar automáticamente las contraseñas
- **Control de acceso:** Políticas IAM controlan quién puede acceder a los secretos
- **Registro de auditoría:** Todo acceso a secretos se registra

**Analogía Simple:**
Imagina Secrets Manager como un banco para contraseñas:
- Guarda todas tus contraseñas en una caja fuerte
- Solo personas autorizadas pueden acceder
- Puede cambiar automáticamente las contraseñas periódicamente
- Registra quién accedió y cuándo

**Cómo funciona:**
- Almacena credenciales de API de DriCloud (nombre de usuario, contraseña, claves API)
- Los contenedores ECS recuperan secretos en tiempo de ejecución
- Los secretos están cifrados en reposo y en tránsito

**Beneficios:**
- Sin credenciales codificadas en el código
- Gestión centralizada de secretos
- Rotación fácil de credenciales sin cambios en el código

---

## Servicios de Seguridad

### 6. WAF (Web Application Firewall)

**¿Qué es?**
WAF es como un guardia de seguridad que protege tu aplicación web de ataques comunes.

**¿Por qué lo usamos?**
- **Protección OWASP Top 10:** Bloquea vulnerabilidades web comunes
- **Protección DDoS:** Protege contra ataques de denegación de servicio
- **Limitación de velocidad:** Previene abuso y ataques de fuerza bruta
- **Detección de entrada maliciosa:** Bloquea inyección SQL, XSS y otros ataques

**Analogía Simple:**
Imagina WAF como un guardia de seguridad en la entrada de un edificio:
- Revisa a todos los que entran
- Bloquea a personas sospechosas o peligrosas
- Limita cuántas veces una persona puede entrar
- Registra todos los intentos de entrada bloqueados

**Cómo funciona:**
- Se sitúa entre API Gateway y ALB
- Inspecciona todas las solicitudes entrantes
- Bloquea solicitudes que coinciden con patrones de ataque
- Registra todas las solicitudes bloqueadas para análisis

**Reglas configuradas:**
1. **Reglas Comunes de AWS:** Protege contra OWASP Top 10
2. **Entradas Maliciosas Conocidas de AWS:** Bloquea entradas maliciosas conocidas
3. **Limitación de Velocidad:** Limita a 2000 solicitudes por IP por 5 minutos

**Beneficios:**
- Protege la API de ataques comunes
- Reduce el riesgo de violaciones de datos
- Cumple con las mejores prácticas de seguridad

---

### 7. VPC Endpoints

**¿Qué es?**
VPC Endpoints permiten conexión privada entre tu red privada y servicios de AWS sin usar internet.

**¿Por qué lo usamos?**
- **Seguridad:** El tráfico nunca sale de la red de AWS
- **Rendimiento:** Menor latencia (sin enrutamiento por internet)
- **Costo:** Sin cargos por transferencia de datos
- **Cumplimiento:** Cumple con requisitos de seguridad para datos sensibles

**Analogía Simple:**
Imagina que tu aplicación necesita hablar con otros servicios:
- **Sin VPC Endpoints:** Como enviar una carta por correo postal (lento, puede perderse, cuesta dinero)
- **Con VPC Endpoints:** Como usar un sistema de tubos neumáticos dentro del mismo edificio (rápido, seguro, gratis)

**Cómo funciona:**
- **Endpoint de Gateway DynamoDB:** Conexión privada a DynamoDB
- **Endpoint de Interfaz Secrets Manager:** Conexión privada a Secrets Manager
- El tráfico permanece dentro de la red de AWS

**Beneficios:**
- Postura de seguridad mejorada
- Latencia reducida
- Costos más bajos (sin tarifas de transferencia de datos)
- Mejor cumplimiento con requisitos de residencia de datos

---

## Monitoreo y Observabilidad

### 8. CloudWatch

**¿Qué es?**
CloudWatch es como un "tablero de control" que monitorea la salud y rendimiento de tu sistema.

**¿Por qué lo usamos?**
- **Monitoreo centralizado:** Todas las métricas en un solo lugar
- **Alarmas:** Alertas automáticas cuando se exceden umbrales
- **Registros:** Agregación centralizada de registros
- **Dashboards:** Representación visual del estado del sistema

**Analogía Simple:**
Imagina CloudWatch como el tablero de control de un automóvil:
- Velocímetro (CPU)
- Medidor de combustible (memoria)
- Luces de advertencia (alarmas)
- Registro de viaje (logs)

**Cómo funciona:**
- **Registros:** Recopila registros de contenedores ECS
- **Métricas:** Rastrea CPU, memoria, conteo de solicitudes, latencia
- **Alarmas:** Envía notificaciones cuando las métricas exceden umbrales
- **Dashboards:** Visualiza métricas clave

**Alarmas configuradas:**
1. **CPU Alto (>80%):** Alerta cuando los contenedores están bajo carga pesada
2. **Memoria Alta (>85%):** Alerta cuando la memoria se está agotando
3. **Objetivos No Saludables:** Alerta cuando los objetivos de ALB se vuelven no saludables
4. **Circuit Breaker Abierto:** Alerta cuando el circuit breaker se activa
5. **Tasa de Error Alta:** Alerta cuando la tasa de error excede el umbral

**Beneficios:**
- Detección proactiva de problemas
- Datos históricos para planificación de capacidad
- Análisis de causa raíz a través de registros

---

### 9. Container Insights

**¿Qué es?**
Container Insights proporciona métricas detalladas para aplicaciones en contenedores.

**¿Por qué lo usamos?**
- **Métricas detalladas:** CPU, memoria, red a nivel de contenedor
- **Visibilidad de rendimiento:** Identificar cuellos de botella rápidamente
- **Optimización de costos:** Entender patrones de uso de recursos

**Analogía Simple:**
Imagina Container Insights como un monitor de salud personal:
- Mide tu frecuencia cardíaca (CPU)
- Mide tu presión arterial (memoria)
- Mide tu actividad física (red)
- Te ayuda a entender cómo estás funcionando

**Cómo funciona:**
- Recopila métricas de tareas ECS
- Proporciona métricas detalladas a nivel de contenedor
- Se integra con dashboards de CloudWatch

**Beneficios:**
- Mejor visibilidad del rendimiento de contenedores
- Depuración más rápida
- Planificación de capacidad basada en datos

---

## Recuperación ante Desastres

### 10. Point-in-Time Recovery (PITR) - DynamoDB

**¿Qué es?**
PITR permite restaurar tablas de DynamoDB a cualquier punto en el tiempo dentro de los últimos 35 días.

**¿Por qué lo usamos?**
- **Protección de datos:** Protección contra eliminación accidental o corrupción
- **Cumplimiento:** Cumple con requisitos de retención de datos
- **Recuperación ante desastres:** Recuperación rápida de incidentes de pérdida de datos

**Analogía Simple:**
Imagina PITR como una "máquina del tiempo" para tus datos:
- Puedes volver atrás en el tiempo hasta 35 días
- Si accidentalmente borras algo, puedes restaurarlo
- Como un "deshacer" pero para toda la base de datos

**Cómo funciona:**
- Hace respaldo automático de datos de tabla continuamente
- Permite restaurar a cualquier segundo dentro de 35 días
- Sin impacto en el rendimiento de las tablas en ejecución

**Beneficios:**
- Protección contra error humano
- Cumplimiento con regulaciones de protección de datos
- Tranquilidad para datos críticos

---

## Escalado Automático

### 11. Application Auto Scaling

**¿Qué es?**
Ajusta automáticamente el número de tareas ECS basado en la demanda.

**¿Por qué lo usamos?**
- **Alta disponibilidad:** Mantiene mínimo 2 tareas siempre corriendo
- **Optimización de costos:** Reduce escala durante tráfico bajo
- **Rendimiento:** Escala hacia arriba automáticamente bajo carga
- **Resistencia:** Sin punto único de falla

**Analogía Simple:**
Imagina Auto Scaling como un restaurante que:
- Siempre tiene al menos 2 cocineros trabajando (mínimo)
- Contrata más cocineros cuando hay muchos clientes (escala hacia arriba)
- Envía cocineros a casa cuando no hay clientes (escala hacia abajo)
- Nunca tiene más de 10 cocineros (máximo)

**Cómo funciona:**
- Monitorea utilización de CPU del servicio ECS
- Escala hacia arriba cuando CPU > 70% (agrega tareas)
- Escala hacia abajo cuando CPU < 70% (elimina tareas)
- Mantiene mínimo 2 tareas, máximo 10 tareas

**Beneficios:**
- Gestión automática de capacidad
- Rentable (pago por lo que usas)
- Maneja picos de tráfico automáticamente
- Asegura disponibilidad del servicio

---

## Seguridad de Despliegues

### 12. Deployment Circuit Breaker

**¿Qué es?**
Detecta automáticamente despliegues fallidos y revierte a la versión anterior.

**¿Por qué lo usamos?**
- **Previene despliegues rotos:** Detiene código malo de ir a producción
- **Recuperación automática:** Revierte sin intervención manual
- **Protección del servicio:** Mantiene disponibilidad del servicio

**Analogía Simple:**
Imagina Circuit Breaker como un sistema de seguridad en un ascensor:
- Si detecta un problema, automáticamente detiene el ascensor
- Revierte a un piso seguro
- Previene que el ascensor se rompa completamente

**Cómo funciona:**
- Monitorea verificaciones de salud durante el despliegue
- Si las verificaciones de salud fallan, automáticamente revierte
- Previene despliegue si la nueva versión no es saludable

**Beneficios:**
- Despliegues sin tiempo de inactividad
- Recuperación automática de despliegues fallidos
- Reduce riesgo de incidentes de producción

---

## Registro de Contenedores

### 13. ECR (Elastic Container Registry)

**¿Qué es?**
ECR es un registro privado y completamente administrado para imágenes Docker.

**¿Por qué lo usamos?**
- **Almacenamiento seguro:** Registro privado para imágenes de contenedor
- **Integración:** Se integra perfectamente con ECS
- **Escaneo de imágenes:** Escaneo automático de vulnerabilidades
- **Control de versiones:** Mantiene versiones de imágenes

**Analogía Simple:**
Imagina ECR como una biblioteca privada:
- Almacena todas tus "recetas" (imágenes Docker)
- Solo personas autorizadas pueden acceder
- Verifica que las recetas no tengan ingredientes peligrosos
- Mantiene un historial de todas las versiones

**Cómo funciona:**
- Almacena imágenes Docker para nuestra API
- ECS extrae imágenes de ECR durante el despliegue
- Escaneo automático de vulnerabilidades de seguridad

**Beneficios:**
- Almacenamiento seguro de imágenes
- Proceso de despliegue fácil
- Detección de vulnerabilidades de seguridad

---

## Resumen de Arquitectura

```
Internet
    ↓
API Gateway (HTTP API v2)
    ↓
WAF (Web Application Firewall)
    ↓
Application Load Balancer
    ↓
ECS Fargate (2-10 tareas)
    ↓
Contenedores API NestJS
    ↓
    ├─→ DynamoDB (vía VPC Endpoint)
    ├─→ Secrets Manager (vía VPC Endpoint)
    └─→ API DriCloud (externo)
```

**Monitoreo:**
- CloudWatch (Registros, Métricas, Alarmas)
- Container Insights (Métricas de contenedor)
- CloudWatch Dashboards (Visualización)

**Seguridad:**
- WAF (Protección contra ataques)
- VPC Endpoints (Conectividad privada)
- Secrets Manager (Gestión de credenciales)
- Security Groups (Aislamiento de red)

**Resistencia:**
- Despliegue multi-AZ
- Escalado automático (2-10 tareas)
- Deployment Circuit Breaker
- Verificaciones de salud en múltiples niveles

---

## Desglose de Costos (Estimación Mensual)

- **ECS Fargate (2 tareas):** ~$36
- **Application Load Balancer:** ~$16
- **API Gateway:** ~$1
- **DynamoDB:** ~$5
- **CloudWatch:** ~$3
- **WAF:** ~$5
- **VPC Endpoints:** ~$14.40
- **Secrets Manager:** ~$0.40
- **Container Insights:** ~$0.20
- **Point-in-Time Recovery:** ~$0.50
- **ECR:** ~$1

**Total:** ~$82/mes para una infraestructura altamente resistente, segura y escalable.

---

## ¿Por Qué Esta Arquitectura?

Esta arquitectura fue elegida para proporcionar:

1. **Alta Disponibilidad:** Despliegue multi-AZ asegura 99.9%+ de tiempo activo
2. **Seguridad:** Múltiples capas de protección (WAF, VPC endpoints, gestión de secretos)
3. **Escalabilidad:** Escalado automático maneja picos de tráfico automáticamente
4. **Observabilidad:** Visibilidad completa del estado del sistema y rendimiento
5. **Recuperación ante Desastres:** PITR asegura que los datos puedan recuperarse
6. **Rentable:** Servicios serverless y administrados reducen sobrecarga operacional
7. **Cumplimiento:** Cumple con requisitos de seguridad y protección de datos

Esta infraestructura está lista para producción y sigue las mejores prácticas del Framework Bien Arquitecturado de AWS.


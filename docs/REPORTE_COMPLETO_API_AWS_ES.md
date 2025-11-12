#  Reporte Completo: Estructura del API y Servicios AWS
## GUA Clinic - Sistema de Gestión de Citas Médicas

Este documento presenta la estructura completa del **API de GUA Clinic** y todos los **servicios de AWS** implementados para el sistema de gestión de citas médicas.

### Estado del Proyecto
- ✅ **100% Funcional** - Todos los módulos implementados y operativos
- ✅ **Producción** - Sistema desplegado y funcionando en AWS
- ✅ **Seguro** - Múltiples capas de seguridad implementadas
- ✅ **Escalable** - Arquitectura preparada para crecimiento

### Capacidades Principales
- Gestión de citas médicas (crear, consultar estado)
- Consulta de disponibilidad de doctores
- Gestión de pacientes (búsqueda, creación)
- Integración con sistema DriCloud (sistema externo de gestión clínica)
- Monitoreo y auditoría completa
- Protección contra ataques y sobrecarga

---

## 📁 Estructura del API

### Jerarquía Completa de Carpetas

```
packages/api/
├── src/
│   ├── main.ts                          # Punto de entrada de la aplicación
│   ├── app.module.ts                    # Módulo principal que conecta todo
│   ├── app.controller.ts                # Controlador principal
│   ├── app.service.ts                   # Servicio principal
│   │
│   ├── appointments/                    # Gestión de Citas
│   │   ├── appointments.controller.ts   # Recibe solicitudes de citas
│   │   ├── appointments.service.ts      # Lógica de creación de citas
│   │   └── dto/
│   │       └── create-appointment.dto.ts # Formulario de datos para citas
│   │
│   ├── appointments-types/              # Tipos de Citas
│   │   ├── appointments-types.controller.ts
│   │   └── appointments-types.service.ts
│   │
│   ├── bootstrap/                      # Inicialización
│   │   ├── bootstrap.controller.ts     # Configuración inicial del widget
│   │   ├── bootstrap.service.ts        # Datos de configuración
│   │   └── session.service.ts          # Gestión de sesiones de usuario
│   │
│   ├── circuit-breaker/                 # Protección contra Fallos
│   │   ├── circuit-breaker.module.ts
│   │   └── circuit-breaker.service.ts  # Evita sobrecargar sistemas externos
│   │
│   ├── common/                          # Utilidades Compartidas
│   │   ├── dto/
│   │   │   └── medical-specialty.dto.ts
│   │   └── version.ts                   # Versión de la aplicación
│   │
│   ├── database/                        # Base de Datos
│   │   ├── database.module.ts
│   │   └── dynamodb.service.ts          # Servicio para DynamoDB (AWS)
│   │
│   ├── doctor-availability/             # Disponibilidad de Doctores
│   │   ├── doctor-availability.controller.ts
│   │   ├── doctor-availability.service.ts
│   │   └── *.spec.ts                    # Tests
│   │
│   ├── doctors/                         # Gestión de Doctores
│   │   ├── doctors.controller.ts
│   │   └── doctors.service.ts
│   │
│   ├── dricloud/                        # Integración con DriCloud
│   │   ├── dricloud.module.ts
│   │   ├── dricloud.service.ts          # Comunicación con API externa
│   │   ├── dricloud.service.spec.ts
│   │   └── mock-data.ts                 # Datos de prueba
│   │
│   ├── health/                          # Verificación de Salud
│   │   ├── health.module.ts
│   │   └── advanced-health-check.service.ts
│   │
│   ├── medical-specialties/             # Especialidades Médicas
│   │   ├── medical-specialties.controller.ts
│   │   └── medical-specialties.service.ts
│   │
│   ├── metrics/                         # Métricas y Monitoreo
│   │   └── cloudwatch-metrics.ts       # Envío de métricas a CloudWatch
│   │
│   ├── patients/                        # Gestión de Pacientes
│   │   ├── patients.controller.ts
│   │   ├── patients.service.ts
│   │   └── dto/
│   │       ├── create-patient.dto.ts
│   │       ├── encrypted-patient.dto.ts
│   │       └── patient-vat.dto.ts
│   │
│   ├── rate-limiting/                   # Control de Tráfico
│   │   ├── rate-limiting.module.ts
│   │   └── smart-rate-limit.service.ts  # Limita solicitudes por usuario
│   │
│   └── secrets/                         # Gestión de Credenciales
│       ├── secrets.module.ts
│       └── secrets-manager.service.ts   # Obtiene credenciales de AWS Secrets Manager
│
├── Dockerfile                           # Configuración para crear contenedor
├── package.json                         # Dependencias del proyecto
├── tsconfig.json                        # Configuración TypeScript
│
└── [Scripts de despliegue y verificación]
    ├── deploy-ecs.sh                    # Despliega en ECS
    ├── setup-secrets.sh                 # Configura credenciales
    ├── verify-aws-infrastructure.sh     # Verifica servicios AWS
    └── ... (más scripts)
```

---

## Explicación de Carpetas y Archivos

### Archivos Principales

#### `main.ts`

**¿Qué es?** El punto de entrada de la aplicación. Es lo primero que se ejecuta cuando el servidor inicia.

**¿Qué hace?**
- Inicia el servidor web
- Configura el puerto (3000)
- Habilita CORS (permite que el widget se comunique)
- Configura Swagger (documentación automática de la API)

**Analogía:** Es como encender el motor de un coche - sin esto, nada funciona.

---

#### `app.module.ts`

**¿Qué es?** El "director de orquesta" que conecta todos los módulos del sistema.

**¿Qué hace?**

- Registra todos los controladores (endpoints de la API)
- Registra todos los servicios (lógica de negocio)
- Conecta módulos entre sí
- Configura módulos globales (configuración, HTTP, etc.)

**Analogía:** Es como el director de una empresa que organiza todos los departamentos para que trabajen juntos.

---

### 🏥Módulo: `appointments/` - Gestión de Citas

#### `appointments.controller.ts`

**¿Qué es?** El punto de entrada para todas las solicitudes relacionadas con citas.

**Endpoints:**
- `POST /appointment` - Crear una nueva cita médica
- `GET /appointment/:id/status` - Consultar el estado de una cita

**¿Qué hace?**

- Recibe las solicitudes del widget/frontend
- Valida que los datos estén completos
- Envía la solicitud al servicio para procesarla
- Devuelve la respuesta al cliente

**Características especiales:**

- Soporta idempotencia (evita crear la misma cita dos veces)
- Maneja errores comunes (datos inválidos, conflictos de horario)

---

#### `appointments.service.ts`

**¿Qué es?** Contiene toda la lógica de negocio para crear y gestionar citas.

**¿Qué hace?**

1. **Crear Cita:**

   - Verifica si ya existe una respuesta idempotente
   - Genera un ID único de seguimiento
   - Guarda el estado inicial como "procesando"
   - Transforma los datos al formato que espera DriCloud
   - Envía la solicitud a DriCloud
   - Actualiza el estado según el resultado (confirmada/fallida)
   - Guarda la respuesta para evitar duplicados

2. **Consultar Estado:**

   - Busca el estado de una cita por su tracking ID
   - Devuelve: pendiente, procesando, confirmada o fallida

**Características:**
- Manejo robusto de errores
- Tracking completo de cada cita
- Integración con DynamoDB para almacenar estados

---

#### `dto/create-appointment.dto.ts`

**¿Qué es?** Define el "formulario" que debe llenarse para crear una cita.

**Campos obligatorios:**
- `PAC_ID`: ID del paciente
- `USU_ID`: ID del doctor
- `FECHA`: Fecha de la cita (formato: YYYY-MM-DD)
- `HORA`: Hora de la cita (formato: HH:MM)

**Campos opcionales:**
- `TCI_ID`: Tipo de cita
- `OBSERVACIONES`: Notas adicionales
- `DES_ID`: ID del despacho
- `CLI_ID`: ID de la clínica

**¿Por qué es importante?**

- Garantiza que lleguen todos los datos necesarios
- Valida que los datos sean del tipo correcto
- Evita errores por información faltante

---

###  Módulo: `appointments-types/` - Tipos de Citas

#### `appointments-types.controller.ts` y `appointments-types.service.ts`

**¿Qué es?** Permite consultar qué tipos de citas están disponibles para un servicio.

**Endpoint:**
- `GET /appointments-types/:serviceId` - Obtiene tipos de citas por servicio

**¿Qué hace?**

- Consulta a DriCloud los tipos de citas disponibles
- Devuelve la lista (ejemplo: consulta general, control, especialidad, etc.)

**Uso:** El widget muestra estas opciones al paciente cuando selecciona un servicio.

---

### Módulo: `bootstrap/` - Inicialización

#### `bootstrap.controller.ts`

**¿Qué es?** Endpoint que se llama cuando el widget se carga por primera vez.

**Endpoint:**

- `GET /bootstrap` - Obtiene configuración inicial y crea sesión

**¿Qué hace?**
- Crea una sesión única para cada usuario
- Establece una cookie segura (httpOnly, secure)
- Devuelve configuración inicial del widget
- Renueva sesiones existentes si es necesario

**Seguridad:**
- Cookies httpOnly (no accesibles desde JavaScript malicioso)
- Seguro en producción (solo HTTPS)
- Protección CSRF - Protege contra ataques CSRF porque el navegador solo envía la cookie en solicitudes que provienen del mismo sitio que la creó

---

#### `bootstrap.service.ts`

**¿Qué es?** Proporciona los datos de configuración inicial.

**¿Qué hace?**
- Devuelve configuración del widget
- Incluye información de sesión
- Proporciona datos necesarios para inicializar el frontend

---

#### `session.service.ts`

**¿Qué es?** Gestiona las sesiones de usuario.

**¿Qué hace?**
- Crea nuevas sesiones con ID único
- Renueva sesiones existentes
- Almacena información de sesión (IP, navegador, fecha de expiración)
- Gestiona expiración de sesiones (30 minutos)

---

### Módulo: `circuit-breaker/` - Protección contra Fallos

#### `circuit-breaker.service.ts`

**¿Qué es?** Un "fusible" que protege el sistema cuando hay problemas con servicios externos.

**¿Qué hace?**

- Monitorea las llamadas a DriCloud
- Si hay muchos errores, "abre el circuito" (deja de intentar)
- Después de un tiempo, intenta de nuevo
- Evita sobrecargar sistemas que están fallando

**Analogía:** Es como un fusible eléctrico - si hay demasiada corriente (errores), se corta para proteger el sistema.

**Beneficios:**

- Evita que el sistema se quede bloqueado esperando respuestas
- Protege contra cascadas de fallos
- Mejora la experiencia del usuario

---

###  Módulo: `common/` - Utilidades Compartidas

#### `version.ts`

**¿Qué es?** Almacena la versión actual de la aplicación.

**Uso:** Para tracking, debugging y actualizaciones.

---

### 💾 Módulo: `database/` - Base de Datos

#### `dynamodb.service.ts`

**¿Qué es?** Servicio que se comunica con DynamoDB (base de datos de AWS).

**¿Qué hace?**

1. **Auditoría:**

   - Registra todas las solicitudes a la API
   - Almacena: quién, qué, cuándo, resultado
   - Útil para debugging y cumplimiento

2. **Caché:**

   - Almacena datos temporalmente para mejorar velocidad
   - Reduce llamadas a DriCloud
   - TTL automático (los datos expiran después de un tiempo)

3. **Idempotencia:**

   - Almacena respuestas para evitar duplicados
   - Si se envía la misma solicitud dos veces, devuelve la misma respuesta

**Tablas DynamoDB:**

- `gua-clinic-audit` - Registros de auditoría
- `gua-clinic-cache` - Datos en caché
- `gua-clinic-idempotency` - Respuestas idempotentes

---

### Módulo: `doctor-availability/` - Disponibilidad de Doctores

#### `doctor-availability.controller.ts` y `doctor-availability.service.ts`

**¿Qué es?** Consulta los horarios disponibles de un doctor.

**Endpoint:**
- `GET /doctor-availability/:doctorId/:startDate` - Obtiene agenda del doctor

**¿Qué hace?**
- Consulta a DriCloud los horarios disponibles
- Devuelve días y horas disponibles para agendar
- Permite especificar cuántos días consultar (máximo 31)

**Uso:** El widget muestra estos horarios al paciente para que seleccione.

---

###  Módulo: `doctors/` - Gestión de Doctores

#### `doctors.controller.ts` y `doctors.service.ts`

**¿Qué es?** Obtiene la lista de doctores disponibles para un servicio.

**Endpoint:**

- `GET /doctors/:serviceId` - Obtiene doctores por servicio

**¿Qué hace?**

- Consulta a DriCloud los doctores disponibles
- Devuelve lista con información de cada doctor

**Uso:** El widget muestra esta lista para que el paciente seleccione un doctor.

---

###  Módulo: `dricloud/` - Integración con DriCloud

#### `dricloud.service.ts`

**¿Qué es?** El "traductor" que se comunica con el sistema externo DriCloud.

**¿Qué hace?**

1. **Autenticación:**

   - Obtiene credenciales de AWS Secrets Manager (lugar seguro para guardar credenciaels en AWS)
   - Genera token de autenticación
   - Renueva token automáticamente cuando expira

2. **Llamadas a API:**

   - Crea citas en DriCloud
   - Consulta disponibilidad de doctores
   - Obtiene información de pacientes
   - Consulta especialidades médicas

3. **Protecciones:**

   - Rate limiting (limita número de solicitudes)
   - Circuit breaker (evita sobrecargar si falla)
   - Timeouts (no espera indefinidamente)
   - Reintentos automáticos en caso de error temporal

4. **Monitoreo:**
   - Registra todas las llamadas
   - Envía métricas a CloudWatch
   - Registra errores para debugging

**Características especiales:**

- Modo Mock: Puede usar datos de prueba en lugar de DriCloud real
- Caché inteligente: Almacena respuestas para reducir llamadas
- Manejo robusto de errores

---

###  Módulo: `health/` - Verificación de Salud

#### `advanced-health-check.service.ts`

**¿Qué es?** Verifica que el sistema esté funcionando correctamente.

**¿Qué hace?**

- Verifica conexión con DynamoDB
- Verifica conexión con Secrets Manager
- Verifica que DriCloud esté accesible
- Devuelve estado de cada componente

**Uso:** El Load Balancer de AWS usa esto para saber si el servidor está sano.

---

###  Módulo: `medical-specialties/` - Especialidades Médicas

#### `medical-specialties.controller.ts` y `medical-specialties.service.ts`

**¿Qué es?** Obtiene la lista de especialidades médicas disponibles.

**Endpoint:**

- `GET /medical-specialties` - Obtiene todas las especialidades

**¿Qué hace?**

- Consulta a DriCloud las especialidades
- Almacena en caché para mejorar velocidad
- Permite forzar recarga con parámetro `?refresh=true`

**Uso:** El widget muestra estas especialidades al paciente.

---

###  Módulo: `metrics/` - Métricas y Monitoreo

#### `cloudwatch-metrics.ts`

**¿Qué es?** Envía métricas de rendimiento a CloudWatch (monitoreo de AWS).

**¿Qué hace?**

- Registra tiempo de respuesta de llamadas a DriCloud
- Cuenta número de solicitudes exitosas/fallidas
- Registra uso de tokens
- Envía métricas personalizadas

**Uso:** Permite crear alarmas y dashboards en AWS para monitorear el sistema.

---

###  Módulo: `patients/` - Gestión de Pacientes

#### `patients.controller.ts` y `patients.service.ts`

**¿Qué es?** Gestiona la información de pacientes.

**Endpoints:**

- `POST /patient` - Crear nuevo paciente
- `POST /patient/vat` - Buscar paciente por VAT (DNI) encriptado

**¿Qué hace?**

- Crea nuevos pacientes en DriCloud
- Busca pacientes existentes
- Maneja encriptación de datos sensibles (DNI)

**Seguridad:**

- Los datos sensibles se encriptan antes de enviarse
- Cumple con protección de datos personales

---

#### `dto/` - Formularios de Datos
- `create-patient.dto.ts` - Formulario para crear paciente
- `encrypted-patient.dto.ts` - Formulario con datos encriptados
- `patient-vat.dto.ts` - Formulario para búsqueda por DNI

---

###  Módulo: `rate-limiting/` - Control de Tráfico

#### `smart-rate-limit.service.ts`

**¿Qué es?** Limita el número de solicitudes que puede hacer un usuario.

**¿Qué hace?**
- Controla cuántas solicitudes por minuto/hora puede hacer cada usuario
- Previene abuso del sistema
- Protege contra ataques de denegación de servicio (DDoS)

**Configuración:**
- Límites diferentes según el tipo de endpoint
- Límites más estrictos para operaciones costosas

---

###  Módulo: `secrets/` - Gestión de Credenciales

#### `secrets-manager.service.ts`

**¿Qué es?** Obtiene credenciales de forma segura desde AWS Secrets Manager.

**¿Qué hace?**
- Obtiene credenciales de DriCloud desde AWS Secrets Manager
- Almacena credenciales en caché (10 minutos) para mejorar velocidad
- Renueva credenciales automáticamente cuando expiran
- Nunca expone credenciales en código o logs

**Seguridad:**

- Las credenciales nunca se almacenan en el código
- Solo se acceden desde AWS Secrets Manager
- Cifrado automático por AWS

**Credenciales gestionadas:**
- Usuario y contraseña de DriCloud
- URL de la API de DriCloud
- ID de la clínica

---

##  Servicios AWS Implementados

### Resumen de Servicios

| Servicio | Propósito | Estado |
|----------|-----------|--------|
| **ECS Fargate** | Ejecuta la aplicación en contenedores | ✅ Activo |
| **Application Load Balancer** | Distribuye tráfico entre servidores | ✅ Activo |
| **API Gateway** | Punto de entrada público de la API | ✅ Activo |
| **DynamoDB** | Base de datos para auditoría y caché | ✅ Activo |
| **Secrets Manager** | Almacenamiento seguro de credenciales | ✅ Activo |
| **CloudWatch** | Monitoreo, logs y alarmas | ✅ Activo |
| **WAF** | Firewall de aplicaciones web | ✅ Activo |
| **VPC Endpoints** | Conexión privada a servicios AWS | ✅ Activo |
| **ECR** | Registro de imágenes Docker | ✅ Activo |
| **Auto Scaling** | Escalado automático de contenedores | ✅ Activo |

---

### 1. ECS Fargate (Elastic Container Service)

**¿Qué es?**
Servicio que ejecuta la aplicación en "contenedores" sin necesidad de administrar servidores físicos.

**Configuración actual:**

- **Cluster:** `gua-clinic-api`
- **Service:** `gua-clinic-api-service`
- **Tareas deseadas:** 2 (mínimo)
- **Tareas máximas:** 10 (auto-scaling)
- **Región:** eu-north-1
- **Multi-AZ:** Sí (distribuido en 2 zonas de disponibilidad)

**¿Qué hace?**

- Ejecuta la API en contenedores Docker
- Escala automáticamente según la carga (CPU 70%)
- Reemplaza contenedores automáticamente si fallan
- Distribuye contenedores en múltiples ubicaciones para alta disponibilidad

**Beneficios:**

- Sin administración de servidores
- Escalado automático
- Alta disponibilidad (99.9%+)
- Solo pagas por lo que usas



---

### 2.  Application Load Balancer (ALB)

**¿Qué es?**
Un "repartidor inteligente" que distribuye las solicitudes de usuarios entre múltiples servidores.

**Configuración actual:**
- **Nombre:** `gua-clinic-api-alb`
- **Tipo:** Application Load Balancer
- **Zonas de disponibilidad:** 2
- **Health Check:** `/health` cada 30 segundos
- **Targets saludables:** 2

**¿Qué hace?**

- Recibe todas las solicitudes de usuarios
- Distribuye el tráfico entre los contenedores de ECS
- Verifica que los servidores estén funcionando (health checks)
- Si un servidor falla, deja de enviarle tráfico automáticamente
- Distribuye carga para evitar sobrecargar un solo servidor

**Beneficios:**

- Alta disponibilidad
- Distribución inteligente de carga
- Detección automática de servidores no saludables
- SSL/TLS automático


---

### 3. 🌐 API Gateway

**¿Qué es?**
El punto de entrada público de la API. Es la "puerta" por donde entran todas las solicitudes.

**Configuración actual:**
- **Tipo:** HTTP API v2
- **Integración:** Application Load Balancer
- **CORS:** Configurado para permitir solicitudes del widget

**¿Qué hace?**
- Expone la API públicamente con una URL única
- Gestiona autenticación y autorización
- Aplica políticas de rate limiting
- Enruta solicitudes al Load Balancer
- Proporciona métricas y logs

**Beneficios:**
- Punto de entrada único y controlado
- Fácil gestión de versiones
- Métricas integradas
- Protección DDoS básica


---

### 4.  DynamoDB

**¿Qué es?**

Base de datos NoSQL administrada de AWS. Muy rápida y escalable.

**Tablas configuradas:**

1. **`gua-clinic-audit`**
   - Almacena registros de auditoría
   - TTL: 30 días (se eliminan automáticamente)
   - Registra: quién, qué, cuándo, resultado

2. **`gua-clinic-cache`**
   - Almacena datos en caché
   - Reduce llamadas a DriCloud
   - TTL configurable por tipo de dato

3. **`gua-clinic-idempotency`**
   - Almacena respuestas para idempotencia
   - Evita procesar la misma solicitud dos veces
   - TTL: 10 minutos

**Configuración:**
- **Región:** eu-north-1
- **Point-in-Time Recovery:** Habilitado (backups automáticos)
- **On-Demand:** Pago por uso (sin capacidad reservada)

**Beneficios:**
- Muy rápida (milisegundos)
- Escalable automáticamente
- Sin administración de servidores
- Backups automáticos

**Costo:** ~$5/mes

---

### 5.  Secrets Manager

**¿Qué es?**
Almacenamiento seguro y cifrado de credenciales y secretos.

**Secretos almacenados:**
- **`gua-clinic/dricloud/credentials`**
  - Usuario y contraseña de DriCloud
  - URL de la API de DriCloud
  - ID de la clínica

**¿Qué hace?**
- Almacena credenciales de forma cifrada
- Controla quién puede acceder
- Rotación automática de credenciales (opcional)
- Auditoría de accesos

**Seguridad:**
- Cifrado en reposo (AES-256)
- Cifrado en tránsito (TLS)
- Control de acceso mediante IAM
- Logs de auditoría

**Beneficios:**
- Las credenciales nunca están en el código
- Cumplimiento de seguridad
- Rotación automática posible
- Auditoría completa

**Costo:** ~$0.40/mes

---

### 6. CloudWatch

**¿Qué es?**
Servicio de monitoreo y observabilidad de AWS.

**Componentes utilizados:**

#### **CloudWatch Logs**

- Almacena todos los logs de la aplicación
- Retención: 7 días
- Búsqueda y filtrado avanzado

#### **CloudWatch Metrics**
- Métricas de la aplicación (tiempo de respuesta, errores, etc.)
- Métricas de infraestructura (CPU, memoria, red)
- Métricas personalizadas de DriCloud

#### **CloudWatch Alarms**
- 5 alarmas configuradas:
  - CPU alta en ECS
  - Memoria alta en ECS
  - Errores 5xx en ALB
  - Tiempo de respuesta alto
  - Errores en llamadas a DriCloud

#### **CloudWatch Dashboards**
- 2 dashboards configurados:
  - Dashboard de infraestructura
  - Dashboard de aplicación

#### **Container Insights**
- Métricas detalladas de contenedores
- Análisis de rendimiento
- Identificación de cuellos de botella

**Beneficios:**
- Visibilidad completa del sistema
- Alertas automáticas
- Debugging facilitado
- Análisis de tendencias

**Costo:** ~$5/mes

---

### 7.  WAF (Web Application Firewall)

**¿Qué es?**
Firewall que protege la aplicación contra ataques comunes.

**Protecciones configuradas:**
- **OWASP Top 10** (protección contra vulnerabilidades comunes)
- **Rate limiting** (limita solicitudes por IP)
- **Protección DDoS** (ataques de denegación de servicio)
- **Filtrado de IPs maliciosas**

**Reglas implementadas:**
- Bloqueo de SQL injection
- Bloqueo de XSS (Cross-Site Scripting)
- Bloqueo de comandos del sistema
- Rate limiting por IP

**¿Qué hace?**
- Inspecciona todas las solicitudes antes de llegar a la aplicación
- Bloquea solicitudes maliciosas automáticamente
- Registra intentos de ataque
- Permite crear reglas personalizadas

**Beneficios:**
- Protección proactiva
- Cumplimiento de seguridad
- Reducción de riesgo
- Visibilidad de amenazas

**Costo:** ~$5/mes + $1 por millón de requests

---

### 8.  VPC Endpoints

**¿Qué es?**
Conexiones privadas dentro de AWS que no salen a internet.

**Endpoints configurados:**
1. **DynamoDB Endpoint**
   - Conexión privada a DynamoDB
   - Sin costos de transferencia de datos
   - Mayor seguridad

2. **Secrets Manager Endpoint**
   - Conexión privada a Secrets Manager
   - Sin costos de transferencia de datos
   - Mayor seguridad

**¿Qué hace?**
- Permite que los contenedores se comuniquen con servicios AWS sin salir a internet
- Todo el tráfico permanece dentro de la red privada de AWS
- Reduce latencia
- Aumenta seguridad

**Beneficios:**
- Mayor seguridad (tráfico privado)
- Menor latencia
- Sin costos de transferencia de datos
- Cumplimiento de seguridad

**Costo:** ~$14.40/mes (2 endpoints)

---

### 9. 📦 ECR (Elastic Container Registry)

**¿Qué es?**
Registro privado para almacenar imágenes Docker.

**¿Qué hace?**
- Almacena las imágenes Docker de la aplicación
- Versiona las imágenes
- Permite desplegar versiones específicas
- Integración automática con ECS

**Beneficios:**
- Almacenamiento seguro de imágenes
- Versionado completo
- Integración con ECS
- Fácil rollback

**Costo:** ~$1/mes

---

### 10. Auto Scaling

**¿Qué es?**
Servicio que escala automáticamente el número de contenedores según la demanda.

**Configuración actual:**
- **Mínimo:** 2 tareas
- **Máximo:** 10 tareas
- **Target:** 70% CPU
- **Política:** Escala hacia arriba si CPU > 70%, escala hacia abajo si CPU < 30%

**¿Qué hace?**
- Monitorea el uso de CPU y memoria
- Aumenta contenedores automáticamente cuando hay mucha carga
- Reduce contenedores cuando hay poca carga
- Ahorra costos al reducir cuando no se necesita

**Beneficios:**
- Escalado automático
- Ahorro de costos
- Alta disponibilidad
- Sin intervención manual

**Costo:** Incluido en ECS (sin costo adicional)

---

## 🏗️ Arquitectura y Flujo de Datos

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET / USUARIOS                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                              │
│              (Punto de entrada público)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      WAF                                     │
│         (Protección contra ataques)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            APPLICATION LOAD BALANCER                         │
│         (Distribución de tráfico)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ECS FARGATE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Contenedor 1 │  │ Contenedor 2 │  │ Contenedor N │      │
│  │   (API)      │  │   (API)      │  │   (API)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         └─────────┬──────────┴──────────┬─────────┘
                   │                      │
         ┌─────────▼──────────┐  ┌───────▼──────────┐
         │   VPC ENDPOINTS    │  │  VPC ENDPOINTS   │
         └─────────┬──────────┘  └───────┬──────────┘
                   │                      │
         ┌─────────▼──────────┐  ┌───────▼──────────┐
         │    DYNAMODB        │  │ SECRETS MANAGER   │
         │  (Base de datos)   │  │  (Credenciales)   │
         └────────────────────┘  └──────────────────┘
                   │
         ┌─────────▼──────────┐
         │    CLOUDWATCH       │
         │  (Monitoreo/Logs)   │
         └─────────────────────┘
                   │
         ┌─────────▼──────────┐
         │    DRICLOUD API    │
         │   (Sistema externo)│
         └────────────────────┘
```

### Flujo de una Solicitud de Cita

1. **Usuario hace clic en "Agendar Cita"** en el widget
2. **Widget envía solicitud** → API Gateway
3. **API Gateway** → WAF (verifica que no sea un ataque)
4. **WAF** → Load Balancer (distribuye a un contenedor disponible)
5. **Load Balancer** → Contenedor ECS (procesa la solicitud)
6. **Contenedor:**
   - Obtiene credenciales de Secrets Manager (vía VPC Endpoint)
   - Valida datos con el DTO
   - Guarda estado "procesando" en DynamoDB (vía VPC Endpoint)
   - Envía solicitud a DriCloud
   - Recibe respuesta de DriCloud
   - Actualiza estado en DynamoDB
   - Envía métricas a CloudWatch
7. **Contenedor** → Load Balancer → API Gateway → Widget
8. **Widget muestra** confirmación al usuario

---

##  Seguridad y Cumplimiento

### Capas de Seguridad Implementadas

#### 1. **Nivel de Red**
- ✅ **WAF:** Protección contra ataques web comunes
- ✅ **Security Groups:** Firewall que controla tráfico de red
- ✅ **VPC Endpoints:** Tráfico privado dentro de AWS
- ✅ **HTTPS/TLS:** Cifrado de datos en tránsito

#### 2. **Nivel de Aplicación**
- ✅ **Rate Limiting:** Limita solicitudes por usuario/IP
- ✅ **Circuit Breaker:** Protege contra sobrecarga
- ✅ **Validación de Datos:** Verifica todos los inputs
- ✅ **CORS:** Controla qué dominios pueden acceder

#### 3. **Nivel de Datos**
- ✅ **Secrets Manager:** Credenciales cifradas
- ✅ **DynamoDB Encryption:** Datos cifrados en reposo
- ✅ **Encriptación de Datos Sensibles:** DNI encriptado antes de enviar

#### 4. **Nivel de Auditoría**
- ✅ **CloudWatch Logs:** Registro de todas las acciones
- ✅ **DynamoDB Audit:** Registro de todas las solicitudes
- ✅ **CloudWatch Alarms:** Alertas de seguridad

### Cumplimiento

- ✅ **Protección de Datos Personales:** Encriptación y gestión segura
- ✅ **Auditoría Completa:** Registro de todas las operaciones
- ✅ **Alta Disponibilidad:** 99.9%+ uptime
- ✅ **Backups Automáticos:** Point-in-Time Recovery en DynamoDB
- ✅ **Monitoreo Continuo:** Alertas y dashboards

---

## Costos Operativos

### Desglose Mensual Estimado

| Servicio | Costo Mensual | Descripción |
|----------|---------------|-------------|
| **ECS Fargate (2 tareas)** | $36 | Ejecución de contenedores |
| **Application Load Balancer** | $16 | Distribución de tráfico |
| **API Gateway** | $3.50 | Punto de entrada público |
| **DynamoDB** | $5 | Base de datos (auditoría/caché) |
| **CloudWatch** | $5 | Monitoreo y logs |
| **WAF** | $5 | Firewall de aplicaciones |
| **VPC Endpoints (2)** | $14.40 | Conexiones privadas |
| **Secrets Manager** | $0.40 | Gestión de credenciales |
| **Container Insights** | $0.20 | Métricas de contenedores |
| **Point-in-Time Recovery** | $0.50 | Backups automáticos |
| **ECR** | $1 | Registro de imágenes |
| **TOTAL** | **~$87/mes** | Costo total operativo |

### Optimizaciones de Costo

- ✅ **Auto Scaling:** Reduce contenedores cuando no hay demanda
- ✅ **On-Demand DynamoDB:** Solo pagas por lo que usas
- ✅ **TTL en DynamoDB:** Elimina datos antiguos automáticamente
- ✅ **Caché inteligente:** Reduce llamadas costosas a DriCloud

### Comparación con Alternativas

- **Servidores tradicionales:** ~$200-500/mes + administración
- **Servicios administrados:** ~$150-300/mes
- **Nuestra solución:** ~$87/mes con mejor disponibilidad y seguridad

**Ahorro estimado:** 50-70% comparado con alternativas tradicionales

---

##  Métricas y Monitoreo

### Dashboards Disponibles

1. **Dashboard de Infraestructura**
   - CPU y memoria de contenedores
   - Número de tareas ejecutándose
   - Tráfico de red
   - Estado del Load Balancer

2. **Dashboard de Aplicación**
   - Tiempo de respuesta de endpoints
   - Número de solicitudes por minuto
   - Tasa de errores
   - Métricas de DriCloud (tiempo de respuesta, errores)

### Alarmas Configuradas

1. **CPU Alta:** Alerta si CPU > 80% por más de 5 minutos
2. **Memoria Alta:** Alerta si memoria > 85% por más de 5 minutos
3. **Errores 5xx:** Alerta si hay más de 10 errores en 5 minutos
4. **Tiempo de Respuesta:** Alerta si tiempo promedio > 3 segundos
5. **Errores DriCloud:** Alerta si hay errores en llamadas a DriCloud

---

##  Resumen Final

### Lo que Hemos Construido

✅ **API Completa y Funcional**

- 8 módulos principales
- 15+ endpoints
- Integración completa con DriCloud
- Gestión de pacientes, doctores, citas y disponibilidad

✅ **Infraestructura AWS Robusta**

- 10 servicios AWS configurados
- Alta disponibilidad (99.9%+)
- Escalado automático
- Múltiples capas de seguridad

✅ **Monitoreo y Observabilidad**

- Dashboards en tiempo real
- Alarmas automáticas
- Logs completos
- Métricas detalladas

✅ **Seguridad de Nivel Empresarial**

- WAF para protección contra ataques
- Cifrado de datos en tránsito y reposo
- Gestión segura de credenciales
- Auditoría completa

### Beneficios Clave

1. **Confiabilidad:** Sistema robusto que rara vez falla
2. **Escalabilidad:** Crece automáticamente con la demanda
3. **Seguridad:** Múltiples capas de protección
4. **Observabilidad:** Visibilidad completa del sistema
5. **Costo-Efectivo:** ~$87/mes para infraestructura completa
6. **Sin Administración:** Todo es administrado por AWS

---


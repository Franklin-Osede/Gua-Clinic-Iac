# Explicación Completa de la Estructura del API - GUA Clinic

## Resumen

Este documento explica **todos** los archivos y carpetas del proyecto API, qué hace cada uno, y por qué está ahí. Está escrito en lenguaje simple para que cualquier persona pueda entenderlo.

---

## Estructura General del Proyecto

```
packages/api/
├── src/                    ← Código fuente de la aplicación
├── test/                   ← Pruebas automatizadas
├── dist/                   ← Código compilado (generado automáticamente)
├── scripts/                ← Scripts de infraestructura y utilidades
├── archivos de configuración
└── documentación
```

**Analogía Simple:**
- `src/` = Tu cocina (donde cocinas)
- `test/` = Tu laboratorio de pruebas (donde pruebas las recetas)
- `dist/` = Tu restaurante (donde sirves la comida ya preparada)
- Scripts = Herramientas de cocina (cuchillos, ollas, etc.)

---

## 📁 Carpeta `src/` - Código Fuente Principal

Esta es la carpeta más importante. Contiene todo el código de la aplicación.

### `src/main.ts`
**¿Qué es?** El archivo que inicia la aplicación.

**¿Qué hace?**
- Inicia el servidor
- Configura seguridad (CORS)
- Configura validación de datos
- Configura documentación (Swagger)
- Configura cookies

**Analogía:** Como encender el motor de un automóvil. Es lo primero que se ejecuta.

---

### `src/app.module.ts`
**¿Qué es?** El archivo que organiza todos los módulos de la aplicación.

**¿Qué hace?**
- Conecta todos los módulos (doctores, citas, pacientes, etc.)
- Define qué controladores y servicios están disponibles
- Configura las dependencias

**Analogía:** Como el director de una orquesta. Coordina todas las partes para que trabajen juntas.

---

### `src/app.controller.ts` y `src/app.service.ts`
**¿Qué son?** El controlador y servicio principal de la aplicación.

**¿Qué hacen?**
- `app.controller.ts`: Maneja las rutas principales (como `/` y `/health`)
- `app.service.ts`: Contiene la lógica de negocio principal

**Analogía:** Como la recepción de un hotel. Es el primer punto de contacto.

---

## 📁 Módulos de Funcionalidad

### `src/appointments/` - Gestión de Citas
**¿Qué hace?** Maneja todo lo relacionado con las citas médicas.

**Archivos:**
- `appointments.controller.ts`: Recibe las solicitudes de citas
- `appointments.service.ts`: Lógica para crear, leer, actualizar citas
- `dto/`: Define la estructura de datos de las citas

**¿Por qué existe?** Para que los usuarios puedan agendar citas médicas.

**Analogía:** Como el sistema de reservas de un restaurante.

---

### `src/appointments-types/` - Tipos de Citas
**¿Qué hace?** Maneja los diferentes tipos de citas (consulta, emergencia, etc.).

**Archivos:**
- `appointments-types.controller.ts`: Endpoints para tipos de citas
- `appointments-types.service.ts`: Lógica de tipos de citas

**¿Por qué existe?** Para categorizar las citas (primera vez, seguimiento, emergencia, etc.).

---

### `src/doctors/` - Gestión de Doctores
**¿Qué hace?** Maneja la información de los doctores.

**Archivos:**
- `doctors.controller.ts`: Endpoints para obtener información de doctores
- `doctors.service.ts`: Lógica para obtener y procesar datos de doctores

**¿Por qué existe?** Para mostrar la lista de doctores disponibles al usuario.

**Analogía:** Como un directorio de doctores.

---

### `src/doctor-availability/` - Disponibilidad de Doctores
**¿Qué hace?** Maneja los horarios disponibles de cada doctor.

**Archivos:**
- `doctor-availability.controller.ts`: Endpoints para consultar disponibilidad
- `doctor-availability.service.ts`: Lógica para calcular horarios disponibles
- `doctor-availability.module.ts`: Módulo que organiza todo

**¿Por qué existe?** Para que los usuarios vean cuándo puede atender cada doctor.

**Analogía:** Como un calendario que muestra cuándo está libre cada doctor.

---

### `src/patients/` - Gestión de Pacientes
**¿Qué hace?** Maneja la información de los pacientes.

**Archivos:**
- `patients.controller.ts`: Endpoints para pacientes
- `patients.service.ts`: Lógica para crear y gestionar pacientes
- `dto/`: Estructura de datos de pacientes

**¿Por qué existe?** Para almacenar y gestionar la información de los pacientes que agendan citas.

**Analogía:** Como una base de datos de clientes.

---

### `src/medical-specialties/` - Especialidades Médicas
**¿Qué hace?** Maneja las especialidades médicas (cardiología, urología, etc.).

**Archivos:**
- `medical-specialties.controller.ts`: Endpoints para especialidades
- `medical-specialties.service.ts`: Lógica para obtener especialidades

**¿Por qué existe?** Para que los usuarios puedan filtrar doctores por especialidad.

**Analogía:** Como un catálogo de especialidades.

---

### `src/bootstrap/` - Inicialización
**¿Qué hace?** Maneja el proceso de inicio de sesión y autenticación.

**Archivos:**
- `bootstrap.controller.ts`: Endpoints de autenticación
- `bootstrap.service.ts`: Lógica de inicio de sesión
- `session.service.ts`: Maneja las sesiones de usuario

**¿Por qué existe?** Para autenticar y mantener sesiones con el sistema DriCloud.

**Analogía:** Como el proceso de check-in en un hotel.

---

## 📁 Módulos de Infraestructura

### `src/dricloud/` - Integración con DriCloud
**¿Qué hace?** Se comunica con el sistema externo DriCloud (CRM médico).

**Archivos:**
- `dricloud.service.ts`: Servicio que hace llamadas a la API de DriCloud
- `dricloud.module.ts`: Módulo que organiza la integración
- `mock-data.ts`: Datos de prueba para desarrollo

**¿Por qué existe?** DriCloud es el sistema externo que tiene toda la información de doctores, citas, etc. Este módulo es el "puente" entre nuestra API y DriCloud.

**Analogía:** Como un traductor que habla con otro sistema.

---

### `src/database/` - Base de Datos
**¿Qué hace?** Maneja la conexión y operaciones con DynamoDB.

**Archivos:**
- `dynamodb.service.ts`: Servicio para guardar y leer datos de DynamoDB
- `database.module.ts`: Módulo de base de datos

**¿Por qué existe?** Para almacenar caché y auditoría de forma rápida.

**Analogía:** Como un archivador rápido donde guardas cosas importantes.

---

### `src/secrets/` - Gestión de Secretos
**¿Qué hace?** Obtiene credenciales de forma segura desde AWS Secrets Manager.

**Archivos:**
- `secrets.service.ts`: Servicio para obtener secretos
- `secrets.module.ts`: Módulo de secretos

**¿Por qué existe?** Para obtener contraseñas y credenciales de forma segura sin hardcodearlas.

**Analogía:** Como una caja fuerte para contraseñas.

---

### `src/circuit-breaker/` - Circuit Breaker
**¿Qué hace?** Protege el sistema cuando DriCloud está caído o lento.

**Archivos:**
- `circuit-breaker.service.ts`: Lógica del circuit breaker
- `circuit-breaker.module.ts`: Módulo del circuit breaker

**¿Por qué existe?** Si DriCloud está caído, el circuit breaker "abre" y evita que nuestro sistema se sobrecargue esperando respuestas.

**Analogía:** Como un fusible eléctrico. Si hay demasiada corriente, se "abre" para proteger el sistema.

---

### `src/rate-limiting/` - Limitación de Velocidad
**¿Qué hace?** Limita cuántas solicitudes puede hacer un usuario en un tiempo determinado.

**Archivos:**
- `smart-rate-limit.service.ts`: Lógica de limitación inteligente
- `rate-limiting.module.ts`: Módulo de rate limiting

**¿Por qué existe?** Para prevenir abuso y proteger el sistema de ataques.

**Analogía:** Como un límite de velocidad en una carretera.

---

### `src/health/` - Verificaciones de Salud
**¿Qué hace?** Proporciona endpoints para verificar que el sistema está funcionando.

**Archivos:**
- `advanced-health-check.service.ts`: Verificaciones avanzadas de salud
- `health.module.ts`: Módulo de salud

**¿Por qué existe?** Para que AWS y los monitores puedan verificar que el sistema está funcionando correctamente.

**Analogía:** Como un chequeo médico periódico.

---

### `src/metrics/` - Métricas
**¿Qué hace?** Envía métricas a CloudWatch para monitoreo.

**Archivos:**
- `cloudwatch-metrics.ts`: Envía métricas a CloudWatch

**¿Por qué existe?** Para monitorear el rendimiento y salud del sistema.

**Analogía:** Como un contador que mide cuántas personas entran a un lugar.

---

### `src/common/` - Código Compartido
**¿Qué hace?** Contiene código que se usa en múltiples lugares.

**Archivos:**
- `version.ts`: Información de versión de la API
- `dto/`: Objetos de transferencia de datos compartidos

**¿Por qué existe?** Para evitar duplicar código y mantener consistencia.

**Analogía:** Como herramientas compartidas en una cocina.

---

## 📁 Carpeta `test/` - Pruebas

### `test/dricloud.integration.test.ts`
**¿Qué hace?** Prueba la integración con DriCloud.

**¿Por qué existe?** Para asegurar que la comunicación con DriCloud funciona correctamente.

---

### `test/simple.integration.test.ts`
**¿Qué hace?** Pruebas de integración simples.

**¿Por qué existe?** Para verificar que los endpoints básicos funcionan.

---

### `test/mocks/`
**¿Qué hace?** Contiene datos de prueba (mocks) para usar en las pruebas.

**¿Por qué existe?** Para poder probar sin necesidad de conectarse a servicios reales.

---

## 📁 Carpeta `dist/` - Código Compilado

**¿Qué es?** Esta carpeta contiene el código JavaScript compilado desde TypeScript.

**¿Por qué existe?** TypeScript se compila a JavaScript para que Node.js pueda ejecutarlo.

**Nota:** Esta carpeta se genera automáticamente. No debes editar archivos aquí.

**Analogía:** Como el código fuente (TypeScript) se "traduce" a JavaScript que la computadora puede ejecutar.

---

## 📄 Archivos de Configuración

### `package.json`
**¿Qué es?** Define las dependencias y scripts del proyecto.

**¿Qué contiene?**
- Lista de librerías necesarias (dependencias)
- Scripts para ejecutar el proyecto (start, build, test, etc.)
- Información del proyecto

**¿Por qué existe?** Para que cualquier desarrollador pueda instalar las dependencias y ejecutar el proyecto.

**Analogía:** Como una lista de ingredientes y recetas para cocinar.

---

### `tsconfig.json`
**¿Qué es?** Configuración del compilador de TypeScript.

**¿Qué hace?** Define cómo TypeScript debe compilar el código.

**¿Por qué existe?** Para configurar cómo se compila TypeScript a JavaScript.

---

### `jest.config.js`
**¿Qué es?** Configuración del framework de pruebas Jest.

**¿Qué hace?** Define cómo ejecutar las pruebas.

**¿Por qué existe?** Para configurar el sistema de pruebas automatizadas.

---

### `Dockerfile`
**¿Qué es?** Instrucciones para crear una imagen Docker del API.

**¿Qué hace?** Define cómo empaquetar la aplicación en un contenedor Docker.

**¿Por qué existe?** Para poder ejecutar la aplicación en cualquier servidor usando Docker.

**Analogía:** Como una receta para empaquetar la aplicación en una "caja" (contenedor).

---

## 📄 Archivos de Documentación

### `DRICLOUD_API_DOCUMENTATION.md`
**¿Qué es?** Documentación de la API de DriCloud.

**¿Por qué existe?** Para entender cómo funciona la API externa de DriCloud.

---

### `DRICLOUD_AVAILABILITY_GUIDE.md`
**¿Qué es?** Guía sobre cómo obtener disponibilidad de DriCloud.

**¿Por qué existe?** Para entender el proceso de obtener horarios disponibles.

---

### `COMO_REVISAR_LOGS.md`
**¿Qué es?** Guía sobre cómo revisar los logs del sistema.

**¿Por qué existe?** Para ayudar a depurar problemas.

---

### `CONFIGURACION_ESPECIALIDADES.md`
**¿Qué es?** Documentación sobre la configuración de especialidades médicas.

**¿Por qué existe?** Para entender cómo se configuran las especialidades.

---

### `TEST_AVAILABILITY.md`
**¿Qué es?** Documentación sobre cómo probar la disponibilidad.

**¿Por qué existe?** Para guiar las pruebas de disponibilidad.

---

### `integration-strategy.md`
**¿Qué es?** Estrategia de integración con DriCloud.

**¿Por qué existe?** Para documentar cómo se integra con el sistema externo.

---

## 🔧 Scripts de Infraestructura

### Scripts de Despliegue

#### `deploy-ecs.sh`
**¿Qué hace?** Despliega la API a AWS ECS.

**¿Cuándo usarlo?** Cuando quieres publicar una nueva versión del API.

---

#### `deploy-ecs-simple.sh`
**¿Qué hace?** Versión simplificada del script de despliegue.

**¿Cuándo usarlo?** Para despliegues rápidos de desarrollo.

---

### Scripts de Verificación

#### `check-ecs-status.sh`
**¿Qué hace?** Verifica el estado del servicio ECS.

**¿Cuándo usarlo?** Para ver si el servicio está corriendo correctamente.

---

#### `check-api-gateway-config.sh`
**¿Qué hace?** Verifica la configuración de API Gateway.

**¿Cuándo usarlo?** Para verificar que los endpoints estén configurados.

---

#### `verify-aws-infrastructure.sh`
**¿Qué hace?** Verifica toda la infraestructura AWS.

**¿Cuándo usarlo?** Para auditorías completas de infraestructura.

---

#### `verify-waf.sh`
**¿Qué hace?** Verifica la configuración de WAF.

**¿Cuándo usarlo?** Para verificar que el firewall esté configurado.

---

### Scripts de Monitoreo

#### `view-cloudwatch-logs.sh`
**¿Qué hace?** Muestra los logs de CloudWatch.

**¿Cuándo usarlo?** Para depurar problemas o ver qué está pasando.

---

#### `check-error-logs.sh`
**¿Qué hace?** Muestra solo los logs de errores.

**¿Cuándo usarlo?** Para encontrar errores rápidamente.

---

### Scripts de Pruebas

#### `test-availability.sh`
**¿Qué hace?** Prueba el endpoint de disponibilidad.

**¿Cuándo usarlo?** Para verificar que la disponibilidad funciona.

---

#### `test-dricloud-availability.sh`
**¿Qué hace?** Prueba la conexión directa con DriCloud.

**¿Cuándo usarlo?** Para verificar que DriCloud está accesible.

---

#### `check-doctors-availability.sh`
**¿Qué hace?** Verifica los datos de disponibilidad de doctores.

**¿Cuándo usarlo?** Para validar los datos de disponibilidad.

---

### Scripts de Configuración

#### `setup-secrets.sh`
**¿Qué hace?** Configura los secretos en AWS Secrets Manager.

**¿Cuándo usarlo?** Al configurar credenciales por primera vez o actualizarlas.

---

#### `setup-api-gateway.sh`
**¿Qué hace?** Configura API Gateway.

**¿Cuándo usarlo?** Al configurar o actualizar API Gateway.

---

#### `setup-waf.sh`
**¿Qué hace?** Configura el Web Application Firewall.

**¿Cuándo usarlo?** Al configurar WAF por primera vez.

---

#### `implement-infrastructure-improvements.sh`
**¿Qué hace?** Implementa todas las mejoras de infraestructura.

**¿Cuándo usarlo?** Para configurar toda la infraestructura de una vez.

---

### Scripts de Diagnóstico

#### `diagnose-504-timeout.sh`
**¿Qué hace?** Diagnostica errores de timeout 504.

**¿Cuándo usarlo?** Cuando hay problemas de timeout.

---

#### `find-missing-integrations.sh`
**¿Qué hace?** Encuentra integraciones faltantes en API Gateway.

**¿Cuándo usarlo?** Para encontrar problemas de configuración.

---

### Scripts de Utilidad

#### `get-api-url.sh`
**¿Qué hace?** Obtiene la URL del API Gateway.

**¿Cuándo usarlo?** Para encontrar la URL del API.

---

#### `ejecutar-debug.sh`
**¿Qué hace?** Ejecuta comandos de depuración.

**¿Cuándo usarlo?** Para depurar problemas.

---

## 📄 Archivos de Configuración Adicionales

### `env-example.txt` y `env-real-example.txt`
**¿Qué son?** Ejemplos de variables de entorno.

**¿Por qué existen?** Para mostrar qué variables de entorno se necesitan.

---

### `waf-rules.json`
**¿Qué es?** Configuración de reglas del WAF.

**¿Por qué existe?** Para definir las reglas de seguridad del firewall.

---

### `start-mock-server.js`
**¿Qué es?** Servidor de prueba que simula DriCloud.

**¿Por qué existe?** Para poder desarrollar sin necesidad de conectarse a DriCloud real.

---

### `run-test-containers.js`
**¿Qué es?** Script para ejecutar pruebas en contenedores.

**¿Por qué existe?** Para probar en un entorno similar a producción.

---

## 🔄 Flujo de Trabajo Típico

### Desarrollo
1. Escribes código en `src/`
2. Ejecutas pruebas en `test/`
3. El código se compila a `dist/`

### Despliegue
1. Construyes la imagen Docker
2. Ejecutas `deploy-ecs.sh`
3. El código se despliega a AWS

### Monitoreo
1. Usas `check-ecs-status.sh` para verificar estado
2. Usas `view-cloudwatch-logs.sh` para ver logs
3. Usas `check-error-logs.sh` para encontrar errores

---

## 📊 Resumen por Categoría

### Código de Aplicación
- `src/appointments/` - Citas
- `src/doctors/` - Doctores
- `src/patients/` - Pacientes
- `src/medical-specialties/` - Especialidades
- `src/doctor-availability/` - Disponibilidad

### Infraestructura
- `src/dricloud/` - Integración externa
- `src/database/` - Base de datos
- `src/secrets/` - Secretos
- `src/circuit-breaker/` - Protección
- `src/rate-limiting/` - Limitación
- `src/health/` - Salud
- `src/metrics/` - Métricas

### Configuración
- `package.json` - Dependencias
- `tsconfig.json` - TypeScript
- `Dockerfile` - Docker
- `jest.config.js` - Pruebas

### Scripts
- Despliegue (deploy-*.sh)
- Verificación (check-*.sh, verify-*.sh)
- Monitoreo (view-*.sh)
- Pruebas (test-*.sh)
- Configuración (setup-*.sh)

### Documentación
- Archivos `.md` con guías y documentación

---

## 🎯 Conclusión

Esta estructura está organizada para:
- **Separar responsabilidades:** Cada carpeta tiene un propósito específico
- **Facilitar mantenimiento:** Es fácil encontrar y modificar código
- **Escalar:** Fácil agregar nuevas funcionalidades
- **Probar:** Estructura clara para pruebas
- **Desplegar:** Scripts automatizados para despliegue

**Analogía Final:**
El proyecto API es como un restaurante bien organizado:
- `src/` = La cocina (donde se prepara la comida)
- `test/` = El laboratorio de calidad (donde se prueba)
- `dist/` = El plato servido (código listo para ejecutar)
- Scripts = Las herramientas (cuchillos, ollas, etc.)
- Documentación = Los manuales de recetas

Cada parte tiene su propósito y trabaja junto para crear un sistema completo y funcional.

---

**Última actualización:** Noviembre 2024


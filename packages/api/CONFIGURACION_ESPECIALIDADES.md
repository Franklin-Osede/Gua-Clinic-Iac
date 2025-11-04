# Configuración de Especialidades Médicas

## Información que viene de DriCloud (API v2.3)

Según la documentación oficial de DriCloud API v2.3, el sistema proporciona automáticamente:

### Endpoints utilizados en nuestro sistema:

1. **`GetEspecialidades`** - Lista de especialidades
   - ✅ `ESP_ID`: Id de la especialidad
   - ✅ `ESP_NOMBRE`: Nombre de la especialidad
   - ✅ `ListadoTIPO_CITA`: Tipos de cita asociados (`TCI_ID`, `TCI_NOMBRE`, `TCI_MINUTOS_CITA`, `ImportePrivado`)
   - ⚠️ **Nota:** Si se pasa `CLI_ID`, solo devuelve especialidades con turnos abiertos futuros

2. **`GetDoctores`** - Profesionales por especialidad
   - ✅ `USU_ID`: Id del doctor
   - ✅ `USU_NOMBRE`: Nombre del doctor
   - ✅ `USU_APELLIDOS`: Apellidos del doctor
   - ✅ `FotoPerfil`: Foto del doctor en base64
   - ✅ `ListadoESPECIALIDAD`: Especialidades asociadas al doctor
   - ✅ `USU_DOC_COLEGIADO`: Número de colegiado
   - ✅ `CITA_ONLINE_MAS_INFO`: Texto configurado para cita online

3. **`GetAgendaDisponibilidad`** - Disponibilidad de horarios
   - ✅ Formato: `"yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"`
   - ✅ Parámetros: `USU_ID`, `fecha`, `ESP_ID`, `TCI_ID`, `diasRecuperar`, etc.

4. **`GetPacienteByNIF`** - Búsqueda de pacientes
   - ✅ Todos los datos del paciente

5. **`PostCreatePaciente`** - Creación de pacientes nuevos

6. **`PostCitaPaciente`** - Reserva de citas
   - ✅ Parámetros: `USU_ID`, `fechaInicioCitaString`, `PAC_ID`, `TCI_ID`, `DES_ID`, `CLI_ID`

## ✅ TODO viene de DriCloud automáticamente

Según la documentación oficial de DriCloud API v2.3, **TODA la información** viene automáticamente:

- ✅ **Especialidades** - `GetEspecialidades`
- ✅ **Profesionales** - `GetDoctores` (con `ESP_ID`)
- ✅ **Fotos de profesionales** - `FotoPerfil` en base64
- ✅ **Tipos de cita** - `ListadoTIPO_CITA` en `GetEspecialidades`
- ✅ **Disponibilidad** - `GetAgendaDisponibilidad`
- ✅ **Datos de pacientes** - `GetPacienteByNIF`
- ✅ **Creación de citas** - `PostCitaPaciente`

**Nota importante sobre `GetEspecialidades`:**
- Si se **pasa `CLI_ID`**: Solo devuelve especialidades con turnos abiertos futuros
- Si **NO se pasa `CLI_ID`**: Devuelve TODAS las especialidades configuradas

**En nuestro sistema:** Actualmente NO enviamos `CLI_ID` para obtener todas las especialidades, y luego filtramos Oncología manualmente.

## Configuración Manual Requerida (Mínima)

### 1. Filtrado de Especialidades ⚠️

**Oncología** se filtra automáticamente porque:
- Son servicios **derivados** (no se reservan directamente)
- Los pacientes son derivados por otros médicos

**Ubicación del filtro:** `packages/api/src/medical-specialties/medical-specialties.service.ts`

### 2. Laboratorio ✅

**Características especiales:**
- ❌ **NO tiene especialistas asociados** como tal
- ✅ **Tiene agenda propia** en DriCloud como si fuese un médico
- 📅 **Horarios configurados en DriCloud:**
  - Lunes y Martes: 8:00 - 10:00
  - Jueves y Viernes: 8:30 - 10:00

**Nota:** La agenda de Laboratorio se maneja completamente en DriCloud. No requiere configuración manual en nuestro sistema. Si Laboratorio aparece en `GetEspecialidades` de DriCloud, funcionará automáticamente.

### 3. Logos SVG (Opcional) 🎨

**Ubicación:** `packages/widget/src/assets/logos/`

**Formato:** Los logos deben ser archivos SVG con nombres descriptivos:
- `UrologiaLogo.svg`
- `GinecologiaLogo.svg`
- `FisioterapiaLogo.svg`
- etc.

**Uso:** Los logos se importan en los componentes de React (`ServiceCard.tsx`) y se renderizan según el nombre de la especialidad.

**Nota:** Si no se agregan logos personalizados, el sistema usa iconos genéricos.

## Especialidades Configuradas

Según la lista proporcionada:

1. ✅ **UROLOGÍA** - Con profesionales asociados
2. ✅ **MEDICINA SEXUAL MASCULINA / ANDROLOGÍA** - Con profesionales asociados
3. ❌ **ONCOLOGÍA** - **FILTRADA** (no aparece en el widget)
4. ✅ **GINECOLOGÍA** - Con profesionales asociados
5. ✅ **FISIOTERAPIA SUELO PÉLVICO** - Con profesionales asociados
6. ✅ **MEDICINA FÍSICA Y REHABILITACIÓN** - Con profesionales asociados
7. ✅ **MEDICINA INTEGRATIVA** - Con profesionales asociados
8. ✅ **PSICOLOGÍA** - Con profesionales asociados
9. ✅ **LABORATORIO** - Sin profesionales, con agenda propia

## Notas Importantes

- ✅ **DriCloud es la ÚNICA fuente de verdad** - Todo viene de la API automáticamente
- ✅ **No hay configuración manual de especialidades/profesionales** - Todo se sincroniza con DriCloud
- ⚠️ Solo se filtra **Oncología** manualmente porque no es reservable directamente
- ✅ **Laboratorio** funciona automáticamente si está configurado en DriCloud con agenda propia
- 🎨 Los **logos SVG** son opcionales - Si no se agregan, se usan iconos genéricos
- 📋 **Para agregar/modificar especialidades o profesionales:** Configúralo directamente en DriCloud, no en nuestro código

## Flujo de Datos

```
DriCloud API v2.3
    ↓
Backend NestJS (DriCloudService)
    ↓
Transformación y Filtrado (Oncología)
    ↓
Caché DynamoDB (10 minutos)
    ↓
Widget React (Frontend)
```

**Tiempo de sincronización:** Máximo 10 minutos (TTL del caché)


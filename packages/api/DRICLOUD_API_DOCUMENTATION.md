# DriCloud API v2.3 - Documentación

Este documento contiene la documentación completa de la API de DriCloud para integración con el sistema de reserva de citas.

## Índice

1. [Login](#login)
2. [Recuperación de Clínicas](#recuperación-de-clínicas)
3. [Recuperación de Despachos](#recuperación-de-despachos)
4. [Recuperación de Sociedades](#recuperación-de-sociedades)
5. [Recuperación de Cómo nos ha Conocido](#recuperación-de-cómo-nos-ha-conocido)
6. [Recuperación de Especialidades](#recuperación-de-especialidades)
7. [Recuperación de Doctores](#recuperación-de-doctores)
8. [Recuperación de Disponibilidad de Agenda](#recuperación-de-disponibilidad-de-agenda)
9. [Recuperación de Datos de Paciente](#recuperación-de-datos-de-paciente)
10. [Creación de Paciente](#creación-de-paciente)
11. [Creación de Cita](#creación-de-cita)
12. [Modificación de Cita](#modificación-de-cita)
13. [Eliminación de Cita](#eliminación-de-cita)
14. [Recuperación de Citas](#recuperación-de-citas)

---

## Login

Para realizar las llamadas previamente se requiere hacer un login utilizando el usuario "WebAPI" que se crea automáticamente una vez que se configura la contraseña de la API en la sección "Sistemas / Suscripción" en la plataforma de la clínica.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/LoginExternalHash
```

Donde `<URLClínica>` es la URL de acceso a la plataforma de la clínica. Algo así como "Dricloud_XXXXXXXXXX"

### Parámetros de entrada

- `userName`: string. Es el nombre de usuario "WebAPI"
- `timeSpanString`: string. yyyyMMddHHmmss del momento actual en el que se realiza la petición. El sistema comprobará que este timespan no difiere en más de 1 minuto (o algunos segundos) del timespan del momento de la comprobación según la hora en España peninsular.
- `hash`: string. El objetivo es enviar la password cifrada y asegurarnos que el logueo es auténtico. Generamos el MD5 de userName + (contraseña del usuario cifrada en MD5) + timeSpan + salt, donde:
  - `userName`: es el nombre de usuario
  - `contraseña del usuario cifrada a su vez en MD5`
  - `timeSpan`: yyyyMMddHHmmss
  - `salt`: una contraseña específica que es "sFfDS395$YGTry546g"
- `idClinica`: int. Id de la clínica vuestra en nuestro sistema que se puede encontrar en el menú "Configuración / Datos Empresa" de la plataforma de la clínica.

### Salida

- `URL`: de la clínica
- `USU_ID`: Id del usuario conectado
- `USU_GUID`: GUID del usuario conectado
- `USU_APITOKEN`: Token utilizando en las llamadas posteriores en el header (con el nombre "USU_APITOKEN") para acceder a los métodos. Tiene una caducidad de 24 horas.

---

## Recuperación de Clínicas

Se devuelven las clínicas dadas de alta en el sistema. Serán utilizadas a la hora de recuperar los despachos, especialidades, la disponibilidad de la agenda y la reserva de la cita.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetClinicas
```

### Parámetros de entrada

No tiene

### Salida

- `CLI_ID`: Id de la clínica
- `CLI_NOMBRE`: Nombre de la clínica
- `CLI_DIRECCION`: Dirección de la clínica
- `CLI_TELEFONO`: Teléfono de la clínica
- `CLI_MAIL`: eMail de la clínica

---

## Recuperación de Despachos

Se devuelven los despachos dados de alta en el sistema. Serán utilizados a la hora de recuperar la disponibilidad de la agenda y la reserva de la cita.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetDespachos
```

### Parámetros de entrada

- `CLI_ID`: int. Id de la clínica. Opcional. Cada despacho está asociado a una clínica. Una clínica puede tener varios despachos.

### Salida

- `DES_ID`: Id del despacho
- `DES_NOMBRE`: Nombre del despacho
- `CLI_ID`: Id de la clínica asociada

---

## Recuperación de Sociedades

Se devuelven las sociedades dadas de alta en el sistema. Serán utilizadas a la hora de recuperar los datos del paciente y a la hora de crear un paciente.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetSociedades
```

### Parámetros de entrada

No tiene

### Salida

- `SOC_ID`: Id de la aseguradora
- `SOC_NOMBRE`: Nombre de la aseguradora

---

## Recuperación de Cómo nos ha Conocido

Se devuelven los tipos de cómo nos ha conocido dados de alta en el sistema. Serán utilizadas a la hora de recuperar los datos del paciente y a la hora de crear un paciente.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetComoConocido
```

### Parámetros de entrada

No tiene

### Salida

- `TCC_ID`: Id del tipo
- `TCC_NOMBRE`: Nombre del tipo

---

## Recuperación de Especialidades

Se devuelven las especialidades dadas de alta en el sistema. Serán utilizadas a la hora de recuperar los doctores y recuperar la disponibilidad de la agenda.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetEspecialidades
```

### Parámetros de entrada

- `CLI_ID`: int. Id de la clínica. Opcional. Cada especialidad está asociada a turnos abiertos en la agenda de los doctores. Si se pasa un Id de clínica, se recuperan las especialidades con turnos abiertos futuros asociadas a turnos en esa clínica.

### Salida

- `ESP_ID`: Id de la especialidad
- `ESP_NOMBRE`: Nombre de la especialidad
- `ListadoTIPO_CITA`: Listado de los tipos de cita asociados a cada especialidad, recuperando:
  - `TCI_ID`: Id del tipo de cita
  - `TCI_NOMBRE`: Nombre del tipo de cita
  - `TCI_MINUTOS_CITA`: Minutos por cita configurados
  - `ImportePrivado`: Coste del tipo de cita por Privado

---

## Recuperación de Doctores

Se devuelven los doctores dados de alta en el sistema. Serán utilizadas a la hora de recuperar la disponibilidad de la agenda y la reserva de la cita.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetDoctores
```

### Parámetros de entrada

- `ESP_ID`: int. Id de la especialidad. Opcional. Cada doctor está asociado a una o varias especialidades. Si se pasa un Id de especialidad, se recuperan los doctores con esa especialidad.

### Salida

- `USU_ID`: Id del doctor
- `USU_NOMBRE`: Nombre del doctor
- `USU_APELLIDOS`: Apellidos del doctor
- `USU_EMAIL`: eMail del doctor
- `FotoPerfil`: Foto del doctor en base64
- `ListadoESPECIALIDAD`: Listado de las especialidades asociadas a cada doctor, recuperando:
  - `ESP_ID`: Id de la especialidad
- `Idioma`: Idioma configurado por el doctor
- `USU_DOC_COLEGIADO`: Número de colegiado del doctor
- `CITA_ONLINE_MAS_INFO`: Texto configurado para el doctor para la cita online

**Formato de respuesta:**
```json
{
  "Doctores": [
    {
      "USU_ID": 25,
      "USU_NOMBRE": "Adoracion",
      "USU_APELLIDOS": "Gil Bolaños",
      "USU_EMAIL": "dorygilb@yahoo.es",
      "FotoPerfil": "",
      "ListadoESPECIALIDAD": [
        {
          "ESP_ID": 10
        }
      ],
      "Idioma": "es",
      "USU_DOC_COLEGIADO": "122",
      "CITA_ONLINE_MAS_INFO": ""
    }
  ]
}
```

---

## Recuperación de Disponibilidad de Agenda

Se devuelven los huecos libres de la agenda correspondiente al doctor.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetAgendaDisponibilidad
```

### Parámetros de entrada

- `USU_ID`: int. Id del doctor. Opcional si se envían los ids de los doctores a recuperar en el parámetro List_USU_ID. Recupera la disponibilidad de un doctor.
- `List_USU_ID`: Listado de int. Opcional si se envía USU_ID. Recupera la disponibilidad de uno o varios doctores.
- `fecha`: string. Fecha de inicio de la solicitud en formato "yyyyMMdd"
- `DES_ID`: int. Id del despacho. Opcional.
- `CLI_ID`: int. Id de la clínica. Opcional.
- `ESP_ID`: int. ID de la especialidad. Opcional.
- `TCI_ID`: int. Id del tipo de cita. Opcional. Si se pasa el tipo de cita, se buscan huecos en la agenda con una duración mínima a la establecida para ese tipo de cita
- `diasRecuperar`: int. Por defecto 7. Acepta valores entre 1 y 31. Enviando 1 se recupera la disponibilidad del día pasado en "fecha"

### Salida

- `Disponibilidad`: Cadena que contiene la fecha y hora del hueco, los minutos de la cita y el Id del despacho, en formato: "yyyyMMddHHmm:<MinCita>:<DES_ID>:<USU_ID>"

---

## Recuperación de Datos de un Paciente por NIF

Se devuelven los datos personales del paciente.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetPacienteByNIF
```

### Parámetros de entrada

- `id`: string. NIF/DNI

### Salida

- `Exists`: Existe o no existe en el sistema
- `Paciente`: Objeto con los datos del paciente, recuperando:
  - `PAC_ID`: Id del paciente
  - `PAC_NOMBRE`: Nombre del paciente
  - `PAC_APELLIDOS`: Apellidos del paciente
  - `PAC_FECHA_NACIMIENTO`: Fecha de nacimiento del paciente
  - `PAC_TELEFONO1`: Teléfono principal del paciente
  - `PAC_SEXO_ID`: 0 = Sin determinar / 1 = Femenino / 2 = Masculino
  - `PAC_NIF`: NIF/DNI del paciente
  - `PAC_PASAPORTE`: Pasaporte del paciente
  - `PAC_SOC_ID`: Id de la aseguradora del paciente
  - `PAC_TRAT_DATOS`: Aceptación del tratamiento de datos
  - `PAC_PROMOCIONES`: Aceptación para recibir promoción
  - `PAC_IDIOMA`: Idioma del paciente
  - `PAC_NACIONALIDAD`: Nacionalidad del paciente
  - `PAC_DIRECCION`: Dirección del paciente
  - `PAC_POBLACION`: Población del paciente
  - `PAC_COD_POSTAL`: CP del paciente
  - `PAC_PAIS`: País del paciente
  - `PAC_FAC_TUTOR_APELLIDOS`: Apellidos del tutor del paciente
  - `PAC_FAC_TUTOR_NOMBRE`: Nombre del tutor del paciente
  - `PAC_FAC_TUTOR_NIF`: NIF/DNI del tutor del paciente
  - `TCC_ID`: Id de cómo nos ha conocido
  - `PAC_EMAIL`: eMail del paciente

---

## Recuperación de Listado de Pacientes por Teléfono

Se devuelven los datos personales del paciente.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetPacientesPorTelefono
```

### Parámetros de entrada

- `telefono`: string.

### Salida

- `Pacientes`: Objeto con los datos de los pacientes recuperados, recuperando:
  - `PAC_ID`: Id del paciente

---

## Recuperación de Datos de un Paciente por Nombre, Apellidos y Teléfono

Se devuelven los datos personales del paciente.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetPacientePorNombreTelefono
```

### Parámetros de entrada

- `nombre`: string. Nombre del paciente
- `apellidos`: string. Apellidos del paciente
- `telefono`: string. Teléfono del paciente

### Salida

Misma estructura que `GetPacienteByNIF`

---

## Creación de Paciente en el Sistema

Se inserta el paciente en el sistema según los datos pasados por parámetro.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/PostCreatePaciente
```

### Parámetros de entrada

- `paciente`: Objeto con los datos del paciente (ver estructura completa en documentación)

### Salida

- `PAC_ID`: Id del paciente

---

## Creación de Cita en el Sistema

Se inserta la cita en el sistema según los datos pasados por parámetro.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/PostCitaPaciente
```

### Parámetros de entrada

- `USU_ID`: int. Id del doctor
- `fechaInicioCitaString`: string. Fecha de inicio de la cita en formato "yyyyMMddHHmm"
- `PAC_ID`: int. Id del paciente
- `TCI_ID`: int. Id del tipo de cita. Opcional. Si no se especifica, se asigna a la primera definida en el sistema.
- `DES_ID`: int. Id del despacho. Opcional.
- `CLI_ID`: int. Id de la clínica. Opcional.
- `observaciones`: string. Observaciones de la cita. Opcional.

### Salida

- `CPA_ID`: Id de la cita

---

## Modificación de Cita en el Sistema

Se modifica la cita en el sistema según los datos pasados por parámetro.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/PostUpdateCitaPaciente
```

### Parámetros de entrada

- `CPA_ID`: int. Id de la cita
- `fechaInicioCitaString`: string. Fecha de inicio de la cita en formato "yyyyMMddHHmm"
- `minutos`: int. Minutos de la cita. Opcional.

### Salida

- `CPA_ID`: Id de la cita

---

## Eliminación de Cita en el Sistema

Se elimina la cita en el sistema.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/PostDeleteCitaPaciente
```

### Parámetros de entrada

- `CPA_ID`: int. Id de la cita

### Salida

- `CPA_ID`: Id de la cita

---

## Recuperación de Citas de un Paciente por NIF

Se recupera la información básica de las citas asociadas a un paciente.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetPacienteCitasByNIF
```

### Parámetros de entrada

- `id`: string. NIF/DNI del paciente
- `fechaInicioString`: string. Fecha de inicio de la solicitud en formato "yyyyMMdd". Opcional.
- `fechaFinString`: string. Fecha de fin de la solicitud en formato "yyyyMMdd". Opcional.
- `USU_ID`: int. Opcional. Id del doctor

### Salida

- `CPA_ID`: Id de la cita
- `CPA_FECHA_INICIO`: Fecha de inicio de la cita en formato "yyyyMMddHHmm"
- `CPA_FECHA_FIN`: Fecha de fin de la cita en formato "yyyyMMddHHmm"
- `USU_ID`: Id del doctor
- `CLI_ID`: Id de la clínica
- `CLI_NOMBRE`: Nombre de la clínica
- `Cancelada`: Verdadero o falso

---

## Recuperación de Citas Agendadas en un Día Concreto

Se recupera la información básica de las citas agendadas en un día concreto.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetCitasPacientes
```

### Parámetros de entrada

- `fecha`: string. Fecha de la solicitud en formato "yyyyMMdd"
- `USU_ID`: int. Id del doctor. Opcional.
- `buscarPorFechaModificacion`: bool. Por defecto false. Si true se filtra por la fecha de la última modificación de los datos del paciente.
- `diasRecuperar`: int. Por defecto 1. Días a recuperar desde la fecha indicada anteriormente.
- `PAC_ID`: int. Opcional. ID del paciente.

### Salida

- `CPA_ID`: Id de la cita
- `CPA_FECHA_INICIO`: Fecha de inicio de la cita en formato "yyyyMMddHHmm"
- `CPA_FECHA_FIN`: Fecha de fin de la cita en formato "yyyyMMddHHmm"
- `PAC_ID`: Id del paciente
- `PAC_NHC`: NHC del paciente
- `USU_ID`: Id del doctor
- `USU_NOMBRE_COMPLETO`: Nombre completo del doctor
- `CLI_ID`: Id de la clínica
- `CLI_NOMBRE`: Nombre de la clínica
- `PAC_NOMBRE`: Nombre del paciente
- `PAC_APELLIDOS`: Apellidos del paciente
- `PAC_TELEFONO1`: Teléfono principal del paciente
- `LINK_CONFIRMACION`: Link a la página Web para confirmar la cita
- `Cancelada`: true/false
- `TCI_ID`: Id del tipo de cita
- `TCI_NOMBRE`: Nombre del tipo de cita
- `CPA_COMENTARIO`: Observaciones de la cita

---

## Recuperación del Historial de un Paciente en Word

Se recupera el historial clínico de un paciente.

**Endpoint:**
```
POST https://apidricloud.dricloud.net/<URLClínica>/api/APIWeb/GetPacienteHistorialDocxById
```

### Parámetros de entrada

- `id`: int. Id interno del paciente (PAC_ID)

### Salida

- `FicheroBase64`: Fichero de Word en base64

---

## Notas Importantes

1. **Autenticación**: Todas las llamadas (excepto Login) requieren el header `USU_APITOKEN` con el token obtenido en el login.

2. **Formato de Fechas**:
   - Fechas: `yyyyMMdd` (ejemplo: `20231103`)
   - Fechas con hora: `yyyyMMddHHmm` (ejemplo: `202311031430`)

3. **Timezone**: El sistema usa la hora de España peninsular para validar los timestamps del login.

4. **Caducidad del Token**: El `USU_APITOKEN` tiene una caducidad de 24 horas.

5. **Formato de Respuesta de Doctores**: 
   - DriCloud devuelve `{ "Doctores": [...] }`
   - El backend debe transformar esto a un array `[{ doctor_id, name, surname, ... }]`



import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { PatientsService } from './patients.service'
import { CreatePatientDto } from './dto/create-patient.dto'
import { PatientVatDto } from './dto/patient-vat.dto'
import { EncryptedPatientDto } from './dto/encrypted-patient.dto'

@ApiTags('patients')
@Controller('patient')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('vat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar paciente por VAT encriptado',
    description: 'Busca un paciente existente usando su VAT (DNI) encriptado'
  })
  @ApiBody({ type: PatientVatDto })
  @ApiResponse({
    status: 200,
    description: 'Paciente encontrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 123 },
        name: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Pérez' },
        email: { type: 'string', example: 'juan.perez@email.com' },
        phone: { type: 'string', example: '+34612345678' },
        dni: { type: 'string', example: '12345678A' },
        birthDate: { type: 'string', example: '1990-01-15' },
        gender: { type: 'string', example: 'M' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async getPatientByVat(@Body() patientVatDto: PatientVatDto) {
    return this.patientsService.getPatientByVat(patientVatDto)
  }

  @Post('encrypted-patient')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear paciente con datos encriptados',
    description: 'Crea un nuevo paciente usando datos encriptados para mayor seguridad'
  })
  @ApiBody({ type: EncryptedPatientDto })
  @ApiResponse({
    status: 201,
    description: 'Paciente creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        PAC_ID: { type: 'number', example: 123 },
        message: { type: 'string', example: 'Paciente creado exitosamente' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Error al crear paciente' })
  async createEncryptedPatient(@Body() encryptedPatientDto: EncryptedPatientDto) {
    return this.patientsService.createEncryptedPatient(encryptedPatientDto)
  }
}

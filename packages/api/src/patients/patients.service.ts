import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreatePatientDto } from './dto/create-patient.dto'
import { PatientVatDto } from './dto/patient-vat.dto'
import { EncryptedPatientDto } from './dto/encrypted-patient.dto'

@Injectable()
export class PatientsService {
  async getPatientByVat(patientVatDto: PatientVatDto) {
    try {
      // TODO: Implementar desencriptación y búsqueda en DriCloud
      // Por ahora retornamos datos mock
      const mockPatient = {
        id: 123,
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+34612345678',
        dni: '12345678A',
        birthDate: '1990-01-15',
        gender: 'M'
      }

      return mockPatient
    } catch (error) {
      throw new NotFoundException('Paciente no encontrado')
    }
  }

  async createEncryptedPatient(encryptedPatientDto: EncryptedPatientDto) {
    try {
      // TODO: Implementar desencriptación y creación en DriCloud
      // Por ahora retornamos ID mock
      const mockPatientId = Math.floor(Math.random() * 1000) + 1

      return {
        PAC_ID: mockPatientId,
        message: 'Paciente creado exitosamente'
      }
    } catch (error) {
      throw new BadRequestException('Error al crear paciente')
    }
  }

  async createPatient(createPatientDto: CreatePatientDto) {
    try {
      // TODO: Implementar creación directa en DriCloud
      const mockPatientId = Math.floor(Math.random() * 1000) + 1

      return {
        PAC_ID: mockPatientId,
        message: 'Paciente creado exitosamente',
        patient: createPatientDto
      }
    } catch (error) {
      throw new BadRequestException('Error al crear paciente')
    }
  }
}

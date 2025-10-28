import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { CreatePatientDto } from './dto/create-patient.dto'
import { PatientVatDto } from './dto/patient-vat.dto'
import { EncryptedPatientDto } from './dto/encrypted-patient.dto'
import { DriCloudService } from '../dricloud/dricloud.service'

@Injectable()
export class PatientsService {
  constructor(private driCloudService: DriCloudService) {}
  async getPatientByVat(patientVatDto: PatientVatDto) {
    // DriCloudService ya tiene protección automática
    const response = await this.driCloudService.getPatientByNIF(patientVatDto.nif)
    
    if (response.Successful && response.Data) {
      return response.Data
    } else {
      throw new NotFoundException('Paciente no encontrado')
    }
  }

  async createEncryptedPatient(encryptedPatientDto: EncryptedPatientDto) {
    // DriCloudService ya tiene protección automática
    const response = await this.driCloudService.createPatient(encryptedPatientDto)
    
    if (response.Successful) {
      return {
        PAC_ID: response.Data.PAC_ID,
        message: 'Paciente creado exitosamente'
      }
    } else {
      throw new BadRequestException(response.Html || 'Error al crear paciente')
    }
  }

  async createPatient(createPatientDto: CreatePatientDto) {
    // DriCloudService ya tiene protección automática
    const response = await this.driCloudService.createPatient(createPatientDto)
    
    if (response.Successful) {
      return {
        PAC_ID: response.Data.PAC_ID,
        message: 'Paciente creado exitosamente',
        patient: createPatientDto
      }
    } else {
      throw new BadRequestException(response.Html || 'Error al crear paciente')
    }
  }
}






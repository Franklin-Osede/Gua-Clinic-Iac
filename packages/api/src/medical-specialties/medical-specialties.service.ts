import { Injectable } from '@nestjs/common'
import { DriCloudService } from '../dricloud/dricloud.service'

@Injectable()
export class MedicalSpecialtiesService {
  constructor(private driCloudService: DriCloudService) {}

  async getMedicalSpecialties() {
    console.log('🏥 MedicalSpecialtiesService: Iniciando petición a DriCloud...')
    
    // DriCloudService ya tiene protección automática
    const response = await this.driCloudService.getMedicalSpecialties()
    console.log('✅ DriCloud response:', response)
    return response.Data || []
  }
}

import { Injectable } from '@nestjs/common'
import { DriCloudService } from '../dricloud/dricloud.service'

@Injectable()
export class MedicalSpecialtiesService {
  constructor(private driCloudService: DriCloudService) {}

  async getMedicalSpecialties() {
    console.log('🏥 MedicalSpecialtiesService: Iniciando petición a DriCloud...')
    try {
      const response = await this.driCloudService.getMedicalSpecialties()
      console.log('✅ DriCloud response:', response)
      return response.Data || []
    } catch (error) {
      console.error('❌ Error fetching medical specialties from DriCloud:', error)
      // Fallback a datos mock en caso de error
      return [
        { id: 1, name: 'Urología', description: 'Especialidad urológica' },
        { id: 2, name: 'Andrología', description: 'Especialidad andrológica' }
      ]
    }
  }
}

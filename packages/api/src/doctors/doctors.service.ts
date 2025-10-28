import { Injectable } from '@nestjs/common'
import { DriCloudService } from '../dricloud/dricloud.service'

@Injectable()
export class DoctorsService {
  constructor(private driCloudService: DriCloudService) {}

  async getDoctors(serviceId: number) {
    try {
      // DriCloudService ya tiene protección automática
      const response = await this.driCloudService.getDoctors(serviceId)
      return response.Data || []
    } catch (error) {
      console.log('⚠️ DriCloud no disponible, usando datos mock para desarrollo')
      // Fallback a datos mock para desarrollo
      return [
        { id: 1, name: 'Dr. García', specialty: 'Urología', serviceId: serviceId },
        { id: 2, name: 'Dr. López', specialty: 'Andrología', serviceId: serviceId },
        { id: 3, name: 'Dr. Martínez', specialty: 'Medicina Sexual', serviceId: serviceId }
      ]
    }
  }
}
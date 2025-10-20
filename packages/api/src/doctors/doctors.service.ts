import { Injectable } from '@nestjs/common'
import { DriCloudService } from '../dricloud/dricloud.service'

@Injectable()
export class DoctorsService {
  constructor(private driCloudService: DriCloudService) {}

  async getDoctors(serviceId: number) {
    try {
      const response = await this.driCloudService.getDoctors(serviceId)
      return response.Data || []
    } catch (error) {
      console.error('Error fetching doctors from DriCloud:', error)
      // Fallback a datos mock en caso de error
      return [
        { id: 1, name: 'Dr. García', specialty: 'Urología' },
        { id: 2, name: 'Dr. López', specialty: 'Andrología' }
      ]
    }
  }
}



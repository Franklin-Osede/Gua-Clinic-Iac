import { Injectable } from '@nestjs/common'

@Injectable()
export class DoctorsService {
  async getDoctors(serviceId: number) {
    // TODO: Integrar con DriCloud API
    return [
      { id: 1, name: 'Dr. García', specialty: 'Urología' },
      { id: 2, name: 'Dr. López', specialty: 'Andrología' }
    ]
  }
}


import { Injectable } from '@nestjs/common'

@Injectable()
export class DoctorAvailabilityService {
  async getDoctorAgenda(doctorId: number, startDate: string, datesToFetch: number) {
    // TODO: Integrar con DriCloud API
    return {
      availableSlots: [
        { date: '2024-12-25', time: '10:00' },
        { date: '2024-12-25', time: '11:00' },
        { date: '2024-12-26', time: '09:00' }
      ]
    }
  }
}


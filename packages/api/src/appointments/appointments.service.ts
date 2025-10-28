import { Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { DriCloudService } from '../dricloud/dricloud.service'

@Injectable()
export class AppointmentsService {
  constructor(private driCloudService: DriCloudService) {}

  async createAppointment(createAppointmentDto: CreateAppointmentDto) {
    // DriCloudService ya tiene protección automática
    const response = await this.driCloudService.createAppointment(createAppointmentDto)
    
    if (response.Successful) {
      return {
        appointmentId: response.Data.CPA_ID,
        message: 'Cita creada exitosamente',
        appointment: {
          ...createAppointmentDto,
          id: response.Data.CPA_ID,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        }
      }
    } else {
      throw new Error(response.Html || 'Error al crear cita en DriCloud')
    }
  }
}


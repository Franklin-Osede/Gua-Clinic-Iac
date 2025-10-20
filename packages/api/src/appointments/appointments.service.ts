import { Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import { CreateAppointmentDto } from './dto/create-appointment.dto'

@Injectable()
export class AppointmentsService {
  async createAppointment(createAppointmentDto: CreateAppointmentDto) {
    try {
      // TODO: Implementar creación en DriCloud
      // Por ahora retornamos datos mock
      const mockAppointmentId = Math.floor(Math.random() * 10000) + 1

      return {
        appointmentId: mockAppointmentId,
        message: 'Cita creada exitosamente',
        appointment: {
          ...createAppointmentDto,
          id: mockAppointmentId,
          status: 'confirmed',
          createdAt: new Date().toISOString()
        }
      }
    } catch (error) {
      if (error.message.includes('conflict')) {
        throw new ConflictException('Ya existe una cita en ese horario')
      }
      throw new BadRequestException('Error al crear la cita')
    }
  }
}


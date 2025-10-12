import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentDto } from './dto/create-appointment.dto'

@ApiTags('appointments')
@Controller('appointment')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva cita médica',
    description: 'Crea una nueva cita médica con todos los datos necesarios'
  })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({
    status: 201,
    description: 'Cita creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'number', example: 12345 },
        message: { type: 'string', example: 'Cita creada exitosamente' },
        appointment: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 12345 },
            patientId: { type: 'number', example: 123 },
            doctorId: { type: 'number', example: 456 },
            appointmentTypeId: { type: 'number', example: 789 },
            date: { type: 'string', example: '2024-12-25' },
            time: { type: 'string', example: '10:00' },
            duration: { type: 'number', example: 30 },
            type: { type: 'string', example: 'virtual' },
            price: { type: 'number', example: 50.00 },
            status: { type: 'string', example: 'confirmed' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'Conflicto: ya existe una cita en ese horario' })
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(createAppointmentDto)
  }
}

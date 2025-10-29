import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Req, Headers } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiHeader } from '@nestjs/swagger'
import { AppointmentsService } from './appointments.service'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { Request } from 'express'

@ApiTags('appointments')
@Controller('appointment')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nueva cita médica',
    description: 'Crea una nueva cita médica con todos los datos necesarios. Soporta idempotencia usando header X-Request-ID'
  })
  @ApiHeader({
    name: 'X-Request-ID',
    description: 'ID único para idempotencia (opcional). Si se envía el mismo ID dos veces, se devuelve la misma respuesta.',
    required: false,
    example: 'req_abc-123-def-456'
  })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({
    status: 201,
    description: 'Cita creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'number', example: 12345 },
        trackingId: { type: 'string', example: 'appt_abc-123-def' },
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
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    // Generar requestId si no se proporciona (para tracking interno)
    const idempotencyKey = requestId || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return this.appointmentsService.createAppointment(createAppointmentDto, idempotencyKey)
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Obtener estado de una cita',
    description: 'Obtiene el estado actual de una cita usando el trackingId'
  })
  @ApiParam({
    name: 'id',
    description: 'Tracking ID de la cita (appt_xxx)',
    example: 'appt_abc-123-def-456'
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la cita obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', example: 'appt_abc-123-def' },
        status: { 
          type: 'string', 
          enum: ['pending', 'processing', 'confirmed', 'failed'],
          example: 'confirmed'
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        errorMessage: { type: 'string', nullable: true }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Estado de cita no encontrado' })
  async getAppointmentStatus(@Param('id') appointmentId: string) {
    return this.appointmentsService.getAppointmentStatus(appointmentId)
  }
}

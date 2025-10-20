import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { AppointmentsTypesService } from './appointments-types.service'

@ApiTags('appointments-types')
@Controller('appointments-types')
export class AppointmentsTypesController {
  constructor(private readonly appointmentsTypesService: AppointmentsTypesService) {}

  @Get(':serviceId')
  @ApiOperation({
    summary: 'Obtener tipos de citas por servicio',
    description: 'Retorna los tipos de citas disponibles para un servicio médico específico'
  })
  @ApiParam({
    name: 'serviceId',
    description: 'ID del servicio médico',
    example: 1,
    type: 'number'
  })
  @ApiQuery({
    name: '_type',
    description: 'Filtrar por tipo específico de cita',
    example: 'first_consultation',
    required: false,
    enum: ['first_consultation', 'revision', 'follow_up']
  })
  @ApiResponse({
    status: 200,
    description: 'Tipos de citas obtenidos exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Primera consulta' },
          description: { type: 'string', example: 'Primera consulta médica' },
          price: { type: 'number', example: 50.00 },
          duration: { type: 'number', example: 30 },
          type: { type: 'string', example: 'first_consultation' },
          serviceId: { type: 'number', example: 1 }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Tipos de citas no encontrados' })
  async getAppointmentTypes(
    @Param('serviceId') serviceId: number,
    @Query('_type') type?: string
  ) {
    return this.appointmentsTypesService.getAppointmentTypes(serviceId, type)
  }
}


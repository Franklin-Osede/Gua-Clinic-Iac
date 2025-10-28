import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsTypesService } from './appointments-types.service';

@ApiTags('appointments-types')
@Controller('appointments-types')
export class AppointmentsTypesController {
  constructor(private readonly appointmentsTypesService: AppointmentsTypesService) {}

  @Get(':serviceId')
  @ApiOperation({ 
    summary: 'Obtener tipos de citas por servicio',
    description: 'Retorna los tipos de citas disponibles para un servicio específico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tipos de citas obtenidos exitosamente'
  })
  async getAppointmentTypes(@Param('serviceId') serviceId: number) {
    return this.appointmentsTypesService.getAppointmentTypes(serviceId);
  }
}
import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { MedicalSpecialtiesService } from './medical-specialties.service'

@ApiTags('medical-specialties')
@Controller('medical-specialties')
export class MedicalSpecialtiesController {
  constructor(private readonly medicalSpecialtiesService: MedicalSpecialtiesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener especialidades médicas',
    description: 'Retorna la lista de especialidades médicas disponibles. Use ?refresh=true para forzar recarga desde DriCloud.'
  })
  @ApiQuery({ 
    name: 'refresh', 
    required: false, 
    type: Boolean, 
    description: 'Si es true, fuerza la recarga desde DriCloud ignorando el caché' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de especialidades médicas obtenida exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Urología' },
          description: { type: 'string', example: 'Especialidad urológica' }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async getMedicalSpecialties(@Query('refresh') refresh?: string) {
    const forceRefresh = refresh === 'true';
    const specialties = await this.medicalSpecialtiesService.getMedicalSpecialties(forceRefresh);
    
    // Asegurar que siempre devolvemos un array
    if (Array.isArray(specialties)) {
      return specialties;
    }
    
    // Si viene en formato { Especialidades: [...] }, extraer el array
    if (specialties && typeof specialties === 'object' && 'Especialidades' in specialties) {
      return Array.isArray(specialties.Especialidades) ? specialties.Especialidades : [];
    }
    
    return [];
  }
}

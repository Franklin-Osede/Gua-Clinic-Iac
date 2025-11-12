import { Controller, Get, Query, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { MedicalSpecialtiesService } from './medical-specialties.service'

@ApiTags('medical-specialties')
@Controller('medical-specialties')
export class MedicalSpecialtiesController {
  private readonly logger = new Logger(MedicalSpecialtiesController.name);

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
    try {
    const forceRefresh = refresh === 'true';
      this.logger.log(`📋 Obteniendo especialidades médicas (refresh: ${forceRefresh})`);
      
    const specialties = await this.medicalSpecialtiesService.getMedicalSpecialties(forceRefresh);
    
    // Asegurar que siempre devolvemos un array
    if (Array.isArray(specialties)) {
        this.logger.log(`✅ Devolviendo ${specialties.length} especialidades`);
      return specialties;
    }
    
    // Si viene en formato { Especialidades: [...] }, extraer el array
    if (specialties && typeof specialties === 'object' && 'Especialidades' in specialties) {
        const extracted = Array.isArray(specialties.Especialidades) ? specialties.Especialidades : [];
        this.logger.log(`✅ Devolviendo ${extracted.length} especialidades (extraídas de objeto)`);
        return extracted;
      }
      
      this.logger.warn('⚠️ No se encontraron especialidades, devolviendo array vacío');
      return [];
    } catch (error) {
      this.logger.error(`❌ Error en MedicalSpecialtiesController.getMedicalSpecialties:`, error);
      this.logger.error(`❌ Error stack:`, error.stack);
      
      // En caso de error, devolver array vacío en lugar de crashear
      // Esto evita que el API Gateway devuelva 503
      this.logger.warn('⚠️ Devolviendo array vacío debido a error');
    return [];
    }
  }
}

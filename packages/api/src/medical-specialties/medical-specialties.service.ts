import { Injectable, Logger } from '@nestjs/common'
import { DriCloudService } from '../dricloud/dricloud.service'
import { DynamoDBService } from '../database/dynamodb.service'

@Injectable()
export class MedicalSpecialtiesService {
  private readonly logger = new Logger(MedicalSpecialtiesService.name);
  private readonly CACHE_KEY = 'medical-specialties';
  private readonly CACHE_TTL_MINUTES = 10; // 10 minutos (datos que cambian poco)

  constructor(
    private driCloudService: DriCloudService,
    private dynamoDBService: DynamoDBService,
  ) {}

  async getMedicalSpecialties() {
    // Verificar caché primero
    const cachedData = await this.dynamoDBService.getFromCache<any>(this.CACHE_KEY);
    
    if (cachedData) {
      this.logger.debug('Returning medical specialties from cache');
      // Si el caché tiene la estructura { Especialidades: [...] }, extraer el array
      if (Array.isArray(cachedData)) {
        return cachedData;
      } else if (cachedData && typeof cachedData === 'object' && 'Especialidades' in cachedData && Array.isArray(cachedData.Especialidades)) {
        return cachedData.Especialidades;
      }
      return [];
    }

    this.logger.log('Fetching medical specialties from DriCloud...');
    
    // DriCloudService ya tiene protección automática
    const response = await this.driCloudService.getMedicalSpecialties();
    
    this.logger.debug(`DriCloud response: ${JSON.stringify(response)}`);
    
    // DriCloud devuelve { Successful: true, Data: { Especialidades: [...] } }
    // o { Successful: true, Data: [...] }
    let specialties: any[] = [];
    
    if (response && response.Data) {
      if (Array.isArray(response.Data)) {
        specialties = response.Data;
      } else if (response.Data.Especialidades && Array.isArray(response.Data.Especialidades)) {
        specialties = response.Data.Especialidades;
      }
    }
    
    this.logger.debug(`Fetched ${specialties.length} medical specialties from DriCloud`);
    
    // Guardar en caché (guardar el array directamente, no el objeto completo)
    await this.dynamoDBService.setCache(
      this.CACHE_KEY,
      specialties,
      this.CACHE_TTL_MINUTES
    );

    this.logger.debug(`Medical specialties cached for ${this.CACHE_TTL_MINUTES} minutes`);
    
    return specialties;
  }
}

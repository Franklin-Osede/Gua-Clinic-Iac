import { Injectable, Logger } from '@nestjs/common'
import { DriCloudService } from '../dricloud/dricloud.service'
import { DynamoDBService } from '../database/dynamodb.service'

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);
  private readonly CACHE_TTL_MINUTES = 5; // 5 minutos (puede cambiar más frecuentemente)

  constructor(
    private driCloudService: DriCloudService,
    private dynamoDBService: DynamoDBService,
  ) {}

  async getDoctors(serviceId: number) {
    const cacheKey = `doctors:${serviceId}`;
    
    // Verificar caché primero
    const cachedData = await this.dynamoDBService.getFromCache<any[]>(cacheKey);
    
    if (cachedData) {
      this.logger.debug(`Returning doctors for service ${serviceId} from cache`);
      return cachedData;
    }

    try {
      this.logger.log(`Fetching doctors for service ${serviceId} from DriCloud...`);
      
      // DriCloudService ya tiene protección automática
      const response = await this.driCloudService.getDoctors(serviceId);
      const doctors = response.Data || [];
      
      // Guardar en caché
      await this.dynamoDBService.setCache(
        cacheKey,
        doctors,
        this.CACHE_TTL_MINUTES
      );

      this.logger.debug(`Doctors cached for ${this.CACHE_TTL_MINUTES} minutes`);
      
      return doctors;
    } catch (error) {
      this.logger.warn('⚠️ DriCloud no disponible, usando datos mock para desarrollo');
      // Fallback a datos mock para desarrollo
      return [
        { id: 1, name: 'Dr. García', specialty: 'Urología', serviceId: serviceId },
        { id: 2, name: 'Dr. López', specialty: 'Andrología', serviceId: serviceId },
        { id: 3, name: 'Dr. Martínez', specialty: 'Medicina Sexual', serviceId: serviceId }
      ]
    }
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { DriCloudService } from '../dricloud/dricloud.service';
import { DynamoDBService } from '../database/dynamodb.service';

@Injectable()
export class AppointmentsTypesService {
  private readonly logger = new Logger(AppointmentsTypesService.name);
  private readonly CACHE_TTL_MINUTES = 10; // 10 minutos

  constructor(
    private readonly driCloudService: DriCloudService,
    private readonly dynamoDBService: DynamoDBService,
  ) {}

  async getAppointmentTypes(serviceId: number) {
    const cacheKey = `appointment-types:${serviceId}`;
    
    // Verificar caché primero
    const cachedData = await this.dynamoDBService.getFromCache<any>(cacheKey);
    
    if (cachedData) {
      this.logger.debug(`Returning appointment types for service ${serviceId} from cache`);
      return cachedData;
    }

    this.logger.log(`Fetching appointment types for service ${serviceId} from DriCloud...`);
    
    const response = await this.driCloudService.getAppointmentTypes(serviceId);
    
    // Guardar en caché
    await this.dynamoDBService.setCache(
      cacheKey,
      response,
      this.CACHE_TTL_MINUTES
    );

    this.logger.debug(`Appointment types cached for ${this.CACHE_TTL_MINUTES} minutes`);
    
    return response;
  }
}
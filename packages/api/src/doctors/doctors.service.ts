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
      
      // Debug: ver estructura de respuesta
      this.logger.debug(`Response type: ${typeof response}, isArray: ${Array.isArray(response)}`);
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        this.logger.debug(`Response keys: ${JSON.stringify(Object.keys(response))}`);
      }
      
      // DriCloud puede devolver diferentes formatos según la documentación:
      // 1. { Doctores: [...] } - formato directo
      // 2. { Successful: true, Data: { Doctores: [...] } } - formato con Successful
      // 3. { Successful: true, Data: [...] } - Data como array directo
      let rawDoctors: any[] = [];
      
      if (Array.isArray(response)) {
        // Si ya es un array, usarlo directamente
        rawDoctors = response;
        this.logger.debug(`Response is already an array with ${rawDoctors.length} items`);
      } else if (response && typeof response === 'object') {
        // Verificar todas las posibles estructuras
        if (response.Doctores && Array.isArray(response.Doctores)) {
          rawDoctors = response.Doctores;
          this.logger.debug(`Found response.Doctores array with ${rawDoctors.length} items`);
        } else if (response.Data?.Doctores && Array.isArray(response.Data.Doctores)) {
          rawDoctors = response.Data.Doctores;
          this.logger.debug(`Found response.Data.Doctores array with ${rawDoctors.length} items`);
        } else if (Array.isArray(response.Data)) {
          rawDoctors = response.Data;
          this.logger.debug(`Found response.Data array with ${rawDoctors.length} items`);
        } else {
          // Log completo para debug
          this.logger.warn(`Unexpected response structure. Keys: ${JSON.stringify(Object.keys(response || {}))}`);
          this.logger.warn(`Response sample: ${JSON.stringify(response).substring(0, 200)}`);
          throw new Error(`Invalid response structure from DriCloud for doctors`);
        }
      } else {
        this.logger.error(`Unexpected response type: ${typeof response}`);
        throw new Error(`Invalid response type from DriCloud: ${typeof response}`);
      }
      
      if (rawDoctors.length === 0) {
        this.logger.warn(`No doctors found for serviceId ${serviceId}`);
      }
      
      this.logger.debug(`Raw doctors count: ${rawDoctors.length}`);
      
      // Transformar formato DriCloud al formato del widget
      const doctors = rawDoctors.map((doctor: any) => ({
        doctor_id: doctor.USU_ID || doctor.doctor_id || doctor.id,
        name: doctor.USU_NOMBRE || doctor.name || '',
        surname: doctor.USU_APELLIDOS || doctor.surname || doctor.apellidos || '',
        // Mantener datos originales por si se necesitan
        ...doctor
      }));
      
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
        { doctor_id: 1, name: 'Dr. García', surname: 'López', specialty: 'Urología', serviceId: serviceId },
        { doctor_id: 2, name: 'Dr. López', surname: 'Martínez', specialty: 'Andrología', serviceId: serviceId },
        { doctor_id: 3, name: 'Dr. Martínez', surname: 'González', specialty: 'Medicina Sexual', serviceId: serviceId }
      ]
    }
  }
}
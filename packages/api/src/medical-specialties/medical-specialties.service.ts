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
        // Asegurar que los datos en caché tengan el formato correcto (id, name)
        return cachedData.map((esp: any) => ({
          id: esp.id || esp.ESP_ID,
          name: esp.name || esp.ESP_NOMBRE || esp.Nombre || '',
          ...esp
        }));
      } else if (cachedData && typeof cachedData === 'object' && 'Especialidades' in cachedData && Array.isArray(cachedData.Especialidades)) {
        return cachedData.Especialidades.map((esp: any) => ({
          id: esp.id || esp.ESP_ID,
          name: esp.name || esp.ESP_NOMBRE || esp.Nombre || '',
          ...esp
        }));
      }
      return [];
    }

    this.logger.log('Fetching medical specialties from DriCloud...');
    
    try {
      // DriCloudService ya tiene protección automática
      const response = await this.driCloudService.getMedicalSpecialties();
      
      this.logger.debug(`DriCloud raw response type: ${typeof response}`);
      this.logger.debug(`DriCloud response keys: ${response ? Object.keys(response).join(', ') : 'null/undefined'}`);
      this.logger.debug(`DriCloud response (first 500 chars): ${JSON.stringify(response).substring(0, 500)}`);
      
      // DriCloud devuelve { Successful: true, Data: { Especialidades: [...] } }
      // o { Successful: true, Data: [...] }
      let specialties: any[] = [];
      
      // Verificar si Successful es false
      if (response && response.Successful === false) {
        this.logger.error(`DriCloud returned Successful: false. Response: ${JSON.stringify(response)}`);
        return [];
      }
      
      if (response && response.Data) {
        if (Array.isArray(response.Data)) {
          specialties = response.Data;
          this.logger.debug(`Found specialties as array, count: ${specialties.length}`);
        } else if (response.Data.Especialidades && Array.isArray(response.Data.Especialidades)) {
          specialties = response.Data.Especialidades;
          this.logger.debug(`Found specialties in Data.Especialidades, count: ${specialties.length}`);
        } else {
          this.logger.warn(`Unexpected Data structure: ${JSON.stringify(response.Data).substring(0, 200)}`);
        }
      } else {
        this.logger.warn(`Response or Data is null/undefined. Response: ${response ? 'exists' : 'null'}, Data: ${response?.Data ? 'exists' : 'null'}`);
      }
      
      this.logger.debug(`Fetched ${specialties.length} medical specialties from DriCloud`);
    
    // Transformar formato DriCloud (ESP_ID, ESP_NOMBRE) a formato del widget (id, name)
    const transformedSpecialties = specialties.map((esp: any) => ({
      id: esp.ESP_ID || esp.id,
      name: esp.ESP_NOMBRE || esp.name || esp.Nombre || '',
      // Mantener datos originales por si se necesitan
      ...esp
    }));
    
    // ⚠️ FILTRAR: Eliminar especialidades que no se pueden reservar directamente
    // Oncología: servicios derivados, no se reservan directamente
    const filteredSpecialties = transformedSpecialties.filter((esp: any) => {
      const name = (esp.name || esp.ESP_NOMBRE || '').toLowerCase();
      // Filtrar "Oncología" y variaciones
      if (name.includes('oncología') || name.includes('oncologia')) {
        this.logger.debug(`Filtered out specialty (not bookable directly): ${esp.name}`);
        return false;
      }
      return true;
    });
    
    this.logger.debug(`Transformed ${transformedSpecialties.length} specialties, filtered to ${filteredSpecialties.length} bookable specialties`);
    
    // Guardar en caché (guardar el array filtrado)
    await this.dynamoDBService.setCache(
      this.CACHE_KEY,
      filteredSpecialties,
      this.CACHE_TTL_MINUTES
    );

    this.logger.debug(`Medical specialties cached for ${this.CACHE_TTL_MINUTES} minutes`);
    
    return filteredSpecialties;
    } catch (error) {
      this.logger.error(`Error fetching medical specialties: ${error.message}`, error.stack);
      return [];
    }
  }
}

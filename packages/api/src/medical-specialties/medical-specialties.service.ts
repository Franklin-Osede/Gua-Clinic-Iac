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

  async getMedicalSpecialties(forceRefresh: boolean = false) {
    try {
      // Si forceRefresh es true, limpiar el caché primero
      if (forceRefresh) {
        this.logger.log('🔄 Forzando recarga de especialidades desde DriCloud (ignorando caché)');
        try {
          await this.dynamoDBService.deleteFromCache(this.CACHE_KEY);
        } catch (cacheError) {
          this.logger.warn('⚠️ Error al limpiar caché (continuando):', cacheError.message);
        }
      }
      
      // Verificar caché primero (solo si no se fuerza refresh)
      if (!forceRefresh) {
        try {
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
        } catch (cacheError) {
          this.logger.warn('⚠️ Error al leer caché (continuando con DriCloud):', cacheError.message);
          // Continuar con DriCloud si el caché falla
        }
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
        // Consulta General y Urgencias: no son especialidades reservables en el widget
        const filteredSpecialties = transformedSpecialties.filter((esp: any) => {
          const name = (esp.name || esp.ESP_NOMBRE || '').toLowerCase().trim();
          
          // Filtrar "Oncología" y variaciones
          if (name.includes('oncología') || name.includes('oncologia')) {
            this.logger.debug(`Filtered out specialty (not bookable directly): ${esp.name}`);
            return false;
          }
          
          // Filtrar "Consulta General" y variaciones
          if (name === 'consulta general' || name === 'consultas generales' || 
              name.includes('consulta general') || name === 'consulta' || name === 'general') {
            this.logger.debug(`Filtered out specialty (not a bookable specialty): ${esp.name}`);
            return false;
          }
          
          // Filtrar "Urgencias" y "Emergencias"
          if (name === 'urgencias' || name === 'emergencias' || name === 'urgencia' || name === 'emergencia' ||
              name.includes('urgencia') || name.includes('emergencia')) {
            this.logger.debug(`Filtered out specialty (not a bookable specialty): ${esp.name}`);
            return false;
          }
          
          return true;
        });
        
        this.logger.debug(`Transformed ${transformedSpecialties.length} specialties, filtered to ${filteredSpecialties.length} bookable specialties`);
        
        // ⚠️ NO CACHEAR si solo quedan especialidades sospechosas o si no hay especialidades válidas
        // Esto evita que se cacheen datos incorrectos de DriCloud
        const suspiciousNames = ['consulta general', 'urgencia', 'emergencia'];
        const hasOnlySuspicious = filteredSpecialties.length > 0 && 
          filteredSpecialties.every((esp: any) => {
            const name = (esp.name || '').toLowerCase();
            return suspiciousNames.some(suspicious => name.includes(suspicious));
          });
        
        if (filteredSpecialties.length === 0) {
          this.logger.warn('⚠️ No hay especialidades válidas después del filtro. NO se guardará en caché.');
          this.logger.warn(`📋 Especialidades originales de DriCloud: ${JSON.stringify(transformedSpecialties.map((e: any) => e.name))}`);
          // Limpiar caché existente si hay datos incorrectos
          try {
            await this.dynamoDBService.deleteFromCache(this.CACHE_KEY);
          } catch (deleteError) {
            this.logger.warn('⚠️ Error al limpiar caché:', deleteError.message);
          }
          return [];
        }
        
        if (hasOnlySuspicious) {
          this.logger.warn('⚠️ Solo se encontraron especialidades sospechosas. NO se guardará en caché.');
          this.logger.warn(`📋 Especialidades sospechosas: ${JSON.stringify(filteredSpecialties.map((e: any) => e.name))}`);
          // Limpiar caché existente si hay datos incorrectos
          try {
            await this.dynamoDBService.deleteFromCache(this.CACHE_KEY);
          } catch (deleteError) {
            this.logger.warn('⚠️ Error al limpiar caché:', deleteError.message);
          }
          return [];
        }
        
        // Guardar en caché solo si hay especialidades válidas
        try {
          await this.dynamoDBService.setCache(
            this.CACHE_KEY,
            filteredSpecialties,
            this.CACHE_TTL_MINUTES
          );
          this.logger.debug(`Medical specialties cached for ${this.CACHE_TTL_MINUTES} minutes`);
        } catch (cacheError) {
          this.logger.warn('⚠️ Error al guardar en caché (continuando):', cacheError.message);
          // Continuar aunque falle el caché
        }
        
        return filteredSpecialties;
      } catch (driCloudError) {
        this.logger.error(`❌ Error al obtener especialidades de DriCloud: ${driCloudError.message}`);
        this.logger.error(`❌ Error stack:`, driCloudError.stack);
        // Devolver array vacío en lugar de lanzar error
        return [];
      }
    } catch (error) {
      this.logger.error(`❌ Error crítico en getMedicalSpecialties: ${error.message}`, error.stack);
      // Siempre devolver array vacío para evitar 503
      return [];
    }
  }
}

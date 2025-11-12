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

  async getDoctors(serviceId: number, forceRefresh: boolean = false) {
    const cacheKey = `doctors:${serviceId}`;
    
    // ⚠️ ESPECIAL: Fisioterapia (ESP_ID 10) también debe incluir doctores de Psicología (ESP_ID 8)
    // porque Jasmina está en Psicología pero debe aparecer en Fisioterapia
    // SIEMPRE limpiar caché de Fisioterapia para asegurar que incluya doctores de Psicología
    const isFisioterapia = serviceId === 10;
    if (isFisioterapia) {
      this.logger.log(`📋 Fisioterapia detectada: limpiando caché para incluir doctores de Psicología (ESP_ID 8)`);
      try {
        await this.dynamoDBService.deleteFromCache(cacheKey);
        this.logger.debug(`✅ Caché de Fisioterapia limpiado para incluir doctores de Psicología`);
        forceRefresh = true; // Forzar refresh para Fisioterapia
      } catch (error) {
        this.logger.warn(`⚠️ Error al limpiar caché de Fisioterapia (continuando):`, error.message);
      }
    }
    
    // Si forceRefresh es true, limpiar el caché primero
    if (forceRefresh) {
      this.logger.log(`🔄 Forzando recarga de doctores para service ${serviceId} (ignorando caché)`);
      try {
        await this.dynamoDBService.deleteFromCache(cacheKey);
        this.logger.debug(`✅ Caché limpiado para service ${serviceId}`);
      } catch (error) {
        this.logger.warn(`⚠️ Error al limpiar caché (continuando):`, error.message);
      }
    }
    
    // Verificar caché primero (solo si no se fuerza refresh)
    if (!forceRefresh) {
      const cachedData = await this.dynamoDBService.getFromCache<any[]>(cacheKey);
      
      if (cachedData) {
        this.logger.debug(`Returning doctors for service ${serviceId} from cache`);
        return cachedData;
      }
    }

    try {
      this.logger.log(`Fetching doctors for service ${serviceId} from DriCloud...`);
      
      // Obtener doctores de especialidades adicionales si es Fisioterapia
      const additionalSpecialtyIds: number[] = [];
      if (isFisioterapia) {
        additionalSpecialtyIds.push(8); // Psicología
        this.logger.log(`📋 Incluyendo doctores de Psicología (ESP_ID 8) para Fisioterapia`);
      }
      
      // Obtener doctores de la especialidad principal
      const response = await this.driCloudService.getDoctors(serviceId);
      
      // Obtener doctores de especialidades adicionales si las hay
      let additionalDoctors: any[] = [];
      for (const additionalId of additionalSpecialtyIds) {
        try {
          this.logger.log(`📋 Obteniendo doctores adicionales de ESP_ID ${additionalId}...`);
          const additionalResponse = await this.driCloudService.getDoctors(additionalId);
          
          // Procesar respuesta adicional de la misma manera
          let additionalRawDoctors: any[] = [];
          if (Array.isArray(additionalResponse)) {
            additionalRawDoctors = additionalResponse;
          } else if (additionalResponse?.Doctores && Array.isArray(additionalResponse.Doctores)) {
            additionalRawDoctors = additionalResponse.Doctores;
          } else if (additionalResponse?.Data?.Doctores && Array.isArray(additionalResponse.Data.Doctores)) {
            additionalRawDoctors = additionalResponse.Data.Doctores;
          } else if (Array.isArray(additionalResponse?.Data)) {
            additionalRawDoctors = additionalResponse.Data;
          }
          
          this.logger.log(`✅ Obtenidos ${additionalRawDoctors.length} doctores adicionales de ESP_ID ${additionalId}`);
          additionalDoctors = additionalDoctors.concat(additionalRawDoctors);
        } catch (error) {
          this.logger.warn(`⚠️ Error al obtener doctores adicionales de ESP_ID ${additionalId}:`, error.message);
          // Continuar aunque falle una especialidad adicional
        }
      }
      
      // Validar que la respuesta no sea un error
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        // Si la respuesta tiene un campo "message", probablemente es un error
        if (response.message === "Service Unavailable" || (response.message && !response.Doctores && !response.Data)) {
          this.logger.error(`❌ Error response from DriCloud: ${response.message}`);
          throw new Error(response.message || "Service Unavailable");
        }
      }
      
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
      
      // Combinar doctores principales con adicionales, evitando duplicados por USU_ID
      const allRawDoctors = [...rawDoctors];
      const existingIds = new Set(rawDoctors.map((d: any) => d.USU_ID || d.doctor_id || d.id));
      
      for (const additionalDoctor of additionalDoctors) {
        const doctorId = additionalDoctor.USU_ID || additionalDoctor.doctor_id || additionalDoctor.id;
        if (!existingIds.has(doctorId)) {
          allRawDoctors.push(additionalDoctor);
          existingIds.add(doctorId);
          this.logger.debug(`➕ Agregado doctor adicional: ${additionalDoctor.USU_NOMBRE || additionalDoctor.name} ${additionalDoctor.USU_APELLIDOS || additionalDoctor.surname} (ID: ${doctorId})`);
        } else {
          this.logger.debug(`⏭️ Doctor duplicado omitido: ${additionalDoctor.USU_NOMBRE || additionalDoctor.name} (ID: ${doctorId})`);
        }
      }
      
      if (allRawDoctors.length === 0) {
        this.logger.warn(`No doctors found for serviceId ${serviceId}`);
      }
      
      this.logger.debug(`Raw doctors count: ${allRawDoctors.length} (${rawDoctors.length} principales + ${additionalDoctors.length} adicionales, ${allRawDoctors.length - rawDoctors.length} únicos agregados)`);
      
      // Transformar formato DriCloud al formato del widget
      const doctors = allRawDoctors.map((doctor: any) => ({
        doctor_id: doctor.USU_ID || doctor.doctor_id || doctor.id,
        name: doctor.USU_NOMBRE || doctor.name || '',
        surname: doctor.USU_APELLIDOS || doctor.surname || doctor.apellidos || '',
        // FotoPerfil puede venir de DriCloud (base64 o vacío)
        FotoPerfil: doctor.FotoPerfil || doctor.fotoPerfil || '',
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
      this.logger.error(`❌ Error fetching doctors for serviceId ${serviceId}:`, error.message || error);
      // No devolver datos mock, solo datos reales
      // Si hay error, lanzarlo para que el frontend lo maneje correctamente
      throw error;
    }
  }
}
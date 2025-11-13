import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DoctorsService } from '../doctors/doctors.service'
import { MedicalSpecialtiesService } from '../medical-specialties/medical-specialties.service'

/**
 * Servicio que pre-carga el caché de doctores y especialidades al iniciar el backend
 * Esto asegura que el primer usuario no tenga que esperar la llamada a DriCloud
 */
@Injectable()
export class CachePreloaderService implements OnModuleInit {
  private readonly logger = new Logger(CachePreloaderService.name)

  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly medicalSpecialtiesService: MedicalSpecialtiesService
  ) {}

  async onModuleInit() {
    // Esperar 5 segundos para que el backend esté completamente listo
    setTimeout(() => {
      this.preloadCache().catch((error) => {
        this.logger.error('Error pre-cargando caché:', error)
      })
    }, 5000)
  }

  private async preloadCache() {
    this.logger.log('🔄 Iniciando pre-carga de caché optimizada para WordPress...')
    
    // PRIMERO: Pre-cargar especialidades médicas (crítico para la primera pantalla)
    try {
      this.logger.log('📋 Pre-cargando especialidades médicas...')
      await this.medicalSpecialtiesService.getMedicalSpecialties(false)
      this.logger.log('✅ Especialidades médicas pre-cargadas')
    } catch (error) {
      this.logger.error(`❌ Error pre-cargando especialidades médicas:`, error.message)
    }
    
    // SEGUNDO: Pre-cargar doctores para las 5 especialidades activas
    // Especialidades: 1) Urología y Andrología, 2) Fisioterapia, 3) Medicina Rehabilitadora, 4) Ginecología, 5) Medicina Integrativa
    this.logger.log('👨‍⚕️ Pre-cargando doctores para las 5 especialidades activas...')
    // Nota: Incluimos tanto Urología (1) como Andrología (18) porque comparten los mismos profesionales
    // pero son IDs separados en DriCloud
    const commonServiceIds = [1, 18, 10, 6, 9, 19] // Urología, Andrología, Fisioterapia, Medicina Rehabilitadora, Ginecología, Medicina Integrativa
    const results = []
    
    // Pre-cargar en paralelo para acelerar (máximo 3 a la vez para no sobrecargar)
    const batchSize = 3
    for (let i = 0; i < commonServiceIds.length; i += batchSize) {
      const batch = commonServiceIds.slice(i, i + batchSize)
      const batchPromises = batch.map(async (serviceId) => {
        try {
          this.logger.debug(`Pre-cargando doctores para serviceId: ${serviceId}`)
          await this.doctorsService.getDoctors(serviceId, false)
          this.logger.debug(`✅ Caché pre-cargado para serviceId: ${serviceId}`)
          return { serviceId, status: 'success' }
        } catch (error) {
          this.logger.warn(`⚠️ Error pre-cargando serviceId ${serviceId}:`, error.message)
          return { serviceId, status: 'error', error: error.message }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Pequeña pausa entre lotes para no sobrecargar DriCloud
      if (i + batchSize < commonServiceIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length
    // Nota: Son 6 IDs pero representan 5 especialidades (Urología y Andrología son IDs separados pero misma especialidad)
    this.logger.log(`✅ Pre-carga de caché completada: ${successCount}/${commonServiceIds.length} IDs de especialidades exitosos (5 especialidades activas)`)
    this.logger.log(`📊 Resumen: ${successCount} IDs con doctores pre-cargados, ${commonServiceIds.length - successCount} con errores`)
    
    return results
  }
}


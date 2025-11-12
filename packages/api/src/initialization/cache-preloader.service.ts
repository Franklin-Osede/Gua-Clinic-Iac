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
    this.logger.log('🔄 Iniciando pre-carga de caché...')
    
    // PRIMERO: Pre-cargar especialidades médicas (crítico para la primera pantalla)
    try {
      this.logger.log('📋 Pre-cargando especialidades médicas...')
      await this.medicalSpecialtiesService.getMedicalSpecialties(false)
      this.logger.log('✅ Especialidades médicas pre-cargadas')
    } catch (error) {
      this.logger.error(`❌ Error pre-cargando especialidades médicas:`, error.message)
    }
    
    // SEGUNDO: Pre-cargar doctores para las especialidades más comunes
    this.logger.log('👨‍⚕️ Pre-cargando doctores...')
    const commonServiceIds = [1, 8, 9, 10, 18] // Urología, Psicología, Ginecología, Fisioterapia, Andrología
    const results = []
    
    for (const serviceId of commonServiceIds) {
      try {
        this.logger.debug(`Pre-cargando doctores para serviceId: ${serviceId}`)
        await this.doctorsService.getDoctors(serviceId, false)
        results.push({ serviceId, status: 'success' })
        this.logger.debug(`✅ Caché pre-cargado para serviceId: ${serviceId}`)
      } catch (error) {
        this.logger.warn(`⚠️ Error pre-cargando serviceId ${serviceId}:`, error.message)
        results.push({ serviceId, status: 'error', error: error.message })
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length
    this.logger.log(`✅ Pre-carga de caché completada: ${successCount}/${commonServiceIds.length} doctores exitosos`)
    
    return results
  }
}


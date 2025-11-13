import { Controller, Get, Param, Query, Post } from '@nestjs/common'
import { DoctorsService } from './doctors.service'

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get(':serviceId')
  async getDoctors(
    @Param('serviceId') serviceId: number,
    @Query('refresh') refresh?: string
  ) {
    const forceRefresh = refresh === 'true';
    return this.doctorsService.getDoctors(serviceId, forceRefresh)
  }

  @Post('preload-cache')
  async preloadCache() {
    // Pre-cargar caché para las 5 especialidades activas
    // Especialidades: 1) Urología y Andrología, 2) Fisioterapia, 3) Medicina Rehabilitadora, 4) Ginecología, 5) Medicina Integrativa
    // Nota: Incluimos tanto Urología (1) como Andrología (18) porque comparten los mismos profesionales
    const commonServiceIds = [1, 18, 10, 6, 9, 19]; // Urología, Andrología, Fisioterapia, Medicina Rehabilitadora, Ginecología, Medicina Integrativa
    const results = [];
    
    for (const serviceId of commonServiceIds) {
      try {
        await this.doctorsService.getDoctors(serviceId, false);
        results.push({ serviceId, status: 'success' });
      } catch (error) {
        results.push({ serviceId, status: 'error', error: error.message });
      }
    }
    
    return { message: 'Cache preloaded', results };
  }
}










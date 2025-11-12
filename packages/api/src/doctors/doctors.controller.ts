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
    // Pre-cargar caché para las especialidades más comunes
    const commonServiceIds = [1, 8, 9, 10, 18]; // Urología, Psicología, Ginecología, Fisioterapia, Andrología
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










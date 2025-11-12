import { Controller, Get, Param, Query } from '@nestjs/common'
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
}










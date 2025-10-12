import { Controller, Get, Param, Query } from '@nestjs/common'
import { DoctorAvailabilityService } from './doctor-availability.service'

@Controller('doctor-availability')
export class DoctorAvailabilityController {
  constructor(private readonly doctorAvailabilityService: DoctorAvailabilityService) {}

  @Get(':doctorId/:startDate')
  async getDoctorAgenda(
    @Param('doctorId') doctorId: number,
    @Param('startDate') startDate: string,
    @Query('dates_to_fetch') datesToFetch: number = 31
  ) {
    return this.doctorAvailabilityService.getDoctorAgenda(doctorId, startDate, datesToFetch)
  }
}


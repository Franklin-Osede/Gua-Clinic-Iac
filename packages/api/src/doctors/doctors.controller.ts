import { Controller, Get, Param } from '@nestjs/common'
import { DoctorsService } from './doctors.service'

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get(':serviceId')
  async getDoctors(@Param('serviceId') serviceId: number) {
    return this.doctorsService.getDoctors(serviceId)
  }
}



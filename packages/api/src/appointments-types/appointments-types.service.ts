import { Injectable } from '@nestjs/common';
import { DriCloudService } from '../dricloud/dricloud.service';

@Injectable()
export class AppointmentsTypesService {
  constructor(private readonly driCloudService: DriCloudService) {}

  async getAppointmentTypes(serviceId: number) {
    return this.driCloudService.getAppointmentTypes(serviceId);
  }
}
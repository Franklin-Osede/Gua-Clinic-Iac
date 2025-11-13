import { Module } from '@nestjs/common'
import { DoctorAvailabilityController } from './doctor-availability.controller'
import { DoctorAvailabilityService } from './doctor-availability.service'
import { DriCloudModule } from '../dricloud/dricloud.module'
import { DatabaseModule } from '../database/database.module'

@Module({
  imports: [DriCloudModule, DatabaseModule],
  controllers: [DoctorAvailabilityController],
  providers: [DoctorAvailabilityService],
  exports: [DoctorAvailabilityService]
})
export class DoctorAvailabilityModule {}








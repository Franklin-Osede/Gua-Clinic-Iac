import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { BootstrapController } from './bootstrap/bootstrap.controller'
import { BootstrapService } from './bootstrap/bootstrap.service'
import { MedicalSpecialtiesController } from './medical-specialties/medical-specialties.controller'
import { MedicalSpecialtiesService } from './medical-specialties/medical-specialties.service'
import { DoctorsController } from './doctors/doctors.controller'
import { DoctorsService } from './doctors/doctors.service'
import { DoctorAvailabilityController } from './doctor-availability/doctor-availability.controller'
import { DoctorAvailabilityService } from './doctor-availability/doctor-availability.service'
import { PatientsController } from './patients/patients.controller'
import { PatientsService } from './patients/patients.service'
import { AppointmentsController } from './appointments/appointments.controller'
import { AppointmentsService } from './appointments/appointments.service'
import { AppointmentsTypesController } from './appointments-types/appointments-types.controller'
import { AppointmentsTypesService } from './appointments-types/appointments-types.service'
import { DriCloudModule } from './dricloud/dricloud.module'
import { DriCloudService } from './dricloud/dricloud.service'
import { RateLimitingModule } from './rate-limiting/rate-limiting.module'
import { HealthModule } from './health/health.module'
import { DatabaseModule } from './database/database.module'
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module'
import { SecretsModule } from './secrets/secrets.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    DriCloudModule,
    RateLimitingModule,
    HealthModule,
    DatabaseModule,
    CircuitBreakerModule,
    SecretsModule,
  ],
  controllers: [
    AppController, 
    BootstrapController,
    MedicalSpecialtiesController,
    DoctorsController,
    DoctorAvailabilityController,
    PatientsController,
    AppointmentsController,
    AppointmentsTypesController
  ],
  providers: [
    AppService, 
    BootstrapService,
    MedicalSpecialtiesService,
    DoctorsService,
    DoctorAvailabilityService,
    PatientsService,
    AppointmentsService,
    AppointmentsTypesService,
    DriCloudService
  ],
})
export class AppModule {}

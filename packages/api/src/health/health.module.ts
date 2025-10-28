import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdvancedHealthCheckService } from './advanced-health-check.service';
import { SecretsModule } from '../secrets/secrets.module';
import { RateLimitingModule } from '../rate-limiting/rate-limiting.module';

@Module({
  imports: [HttpModule, SecretsModule, RateLimitingModule],
  providers: [AdvancedHealthCheckService],
  exports: [AdvancedHealthCheckService],
})
export class HealthModule {}

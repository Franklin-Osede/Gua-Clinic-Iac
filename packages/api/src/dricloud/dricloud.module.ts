import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DriCloudService } from './dricloud.service';
import { SecretsModule } from '../secrets/secrets.module';
import { RateLimitingModule } from '../rate-limiting/rate-limiting.module';
import { DatabaseModule } from '../database/database.module';
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';

@Module({
  imports: [HttpModule, SecretsModule, RateLimitingModule, DatabaseModule, CircuitBreakerModule],
  providers: [DriCloudService],
  exports: [DriCloudService],
})
export class DriCloudModule {}








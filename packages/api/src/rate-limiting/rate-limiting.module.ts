import { Module } from '@nestjs/common';
import { SmartRateLimitService } from './smart-rate-limit.service';

@Module({
  providers: [SmartRateLimitService],
  exports: [SmartRateLimitService],
})
export class RateLimitingModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DriCloudService } from './dricloud.service';

@Module({
  imports: [HttpModule],
  providers: [DriCloudService],
  exports: [DriCloudService],
})
export class DriCloudModule {}

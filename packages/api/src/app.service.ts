import { Injectable } from '@nestjs/common'
import { DriCloudService } from './dricloud/dricloud.service'

@Injectable()
export class AppService {
  constructor(private driCloudService: DriCloudService) {}

  getHello(): string {
    return 'GUA API - Sistema de citas médicas'
  }

  getTokenStats() {
    return this.driCloudService.getTokenStats()
  }
}

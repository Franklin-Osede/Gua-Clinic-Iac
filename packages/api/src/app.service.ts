import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): string {
    return 'GUA API - Sistema de citas médicas'
  }
}

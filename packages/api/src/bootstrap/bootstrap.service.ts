import { Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'

@Injectable()
export class BootstrapService {
  async createSession() {
    // Generar token de sesión
    const token = randomBytes(32).toString('hex')
    
    return {
      token,
      locale: 'es',
      theme: 'light',
      features: {
        virtualAppointments: true,
        physicalAppointments: true,
      },
    }
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class BootstrapService {
  getBootstrapData() {
    return {
      session: {
        id: 'session_' + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        locale: 'es',
        theme: 'light'
      },
      config: {
        features: {
          virtualAppointments: true,
          physicalAppointments: true
        }
      }
    };
  }
}
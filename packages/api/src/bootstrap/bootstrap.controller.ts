import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('bootstrap')
@Controller('bootstrap')
export class BootstrapController {
  @Get()
  @ApiOperation({ 
    summary: 'Bootstrap endpoint',
    description: 'Returns session data and initial configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bootstrap data retrieved successfully'
  })
  getBootstrap() {
    return {
      session: {
        id: 'session_' + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        locale: 'es',
        theme: 'light'
      },
      config: {
        features: {
          virtualAppointments: true,
          physicalAppointments: true
        },
        limits: {
          maxAppointmentsPerDay: 10
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}
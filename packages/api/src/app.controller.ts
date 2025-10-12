import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AppService } from './app.service'
import { VERSION_INFO } from './common/version'

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'gua-api'
    }
  }

  @Get('version')
  @ApiOperation({ 
    summary: 'Get API version information',
    description: 'Returns current API version, build date, and environment information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Version information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string', example: '1.0.0' },
        name: { type: 'string', example: 'GUA Clinic API' },
        description: { type: 'string', example: 'API para el sistema de citas médicas GUA Clinic' },
        buildDate: { type: 'string', format: 'date-time' },
        environment: { type: 'string', example: 'development' }
      }
    }
  })
  getVersion() {
    return VERSION_INFO
  }
}

import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AppService } from './app.service'
import { VERSION_INFO } from './common/version'
import { SmartRateLimitService } from './rate-limiting/smart-rate-limit.service'
import { AdvancedHealthCheckService } from './health/advanced-health-check.service'
import { DynamoDBService } from './database/dynamodb.service'
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service'

@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly smartRateLimitService: SmartRateLimitService,
    private readonly advancedHealthCheckService: AdvancedHealthCheckService,
    private readonly dynamoDBService: DynamoDBService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('health')
  @ApiOperation({ summary: 'Basic health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  getHealth() {
    return this.advancedHealthCheckService.getBasicHealth()
  }

  @Get('health/advanced')
  @ApiOperation({ 
    summary: 'Advanced health check endpoint',
    description: 'Returns detailed health status of all system components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Advanced health check completed'
  })
  async getAdvancedHealth() {
    return this.advancedHealthCheckService.getSystemHealth()
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

  @Get('token-stats')
  @ApiOperation({ 
    summary: 'Get DriCloud token statistics',
    description: 'Returns current token status and refresh statistics for debugging'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token statistics retrieved successfully'
  })
  @Get('rate-limit-status')
  @ApiOperation({ 
    summary: 'Get rate limiting status',
    description: 'Returns current rate limiting status and conflict detection information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Rate limiting status retrieved successfully'
  })
  @Get('cache-stats')
  @ApiOperation({ 
    summary: 'Get cache statistics',
    description: 'Returns DynamoDB cache statistics and performance metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache statistics retrieved successfully'
  })
  async getCacheStats() {
    return this.dynamoDBService.getCacheStats()
  }

  @Get('audit-records')
  @ApiOperation({ 
    summary: 'Get audit records',
    description: 'Returns recent audit records from DynamoDB'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Audit records retrieved successfully'
  })
  @Get('circuit-breaker-status')
  @ApiOperation({ 
    summary: 'Get circuit breaker status',
    description: 'Returns current circuit breaker state and statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Circuit breaker status retrieved successfully'
  })
  getCircuitBreakerStatus() {
    return this.circuitBreakerService.getState()
  }

  @Get('system-status')
  @ApiOperation({ 
    summary: 'Get complete system status',
    description: 'Returns comprehensive system status including all components'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System status retrieved successfully'
  })
  async getSystemStatus() {
    const [health, rateLimit, circuitBreaker, cacheStats] = await Promise.all([
      this.advancedHealthCheckService.getSystemHealth(),
      Promise.resolve(this.smartRateLimitService.getStatus()),
      Promise.resolve(this.circuitBreakerService.getState()),
      this.dynamoDBService.getCacheStats()
    ]);

    return {
      timestamp: new Date().toISOString(),
      health,
      rateLimiting: rateLimit,
      circuitBreaker,
      cache: cacheStats,
      summary: {
        overallHealth: health.overall,
        conflictDetected: rateLimit.conflictDetected,
        circuitOpen: circuitBreaker.state === 'OPEN',
        cacheHitRate: cacheStats.totalHits / Math.max(cacheStats.totalEntries, 1)
      }
    };
  }
}

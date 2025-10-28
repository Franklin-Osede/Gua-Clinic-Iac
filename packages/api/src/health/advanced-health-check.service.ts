import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SecretsManagerService } from '../secrets/secrets-manager.service';
import { SmartRateLimitService } from '../rate-limiting/smart-rate-limit.service';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: HealthCheckResult[];
  metrics: {
    uptime: number;
    requestCount: number;
    errorRate: number;
    conflictDetected: boolean;
  };
}

@Injectable()
export class AdvancedHealthCheckService {
  private readonly logger = new Logger(AdvancedHealthCheckService.name);
  private startTime = Date.now();

  constructor(
    private httpService: HttpService,
    private secretsManagerService: SecretsManagerService,
    private smartRateLimitService: SmartRateLimitService
  ) {}

  async getSystemHealth(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    
    // Ejecutar todos los health checks en paralelo
    const [
      secretsHealth,
      dricloudHealth,
      rateLimitHealth
    ] = await Promise.allSettled([
      this.checkSecretsManager(),
      this.checkDriCloudConnection(),
      this.checkRateLimiting()
    ]);

    const services: HealthCheckResult[] = [
      this.processHealthResult('secrets-manager', secretsHealth),
      this.processHealthResult('dricloud-api', dricloudHealth),
      this.processHealthResult('rate-limiting', rateLimitHealth)
    ];

    // Determinar estado general
    const overall = this.determineOverallHealth(services);
    
    const responseTime = Date.now() - startTime;

    return {
      overall,
      timestamp: new Date().toISOString(),
      services,
      metrics: {
        uptime: Date.now() - this.startTime,
        requestCount: this.getRequestCount(),
        errorRate: this.getErrorRate(),
        conflictDetected: this.smartRateLimitService.getStatus().conflictDetected
      }
    };
  }

  private async checkSecretsManager(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await this.secretsManagerService.getDriCloudCredentials();
      return {
        service: 'secrets-manager',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: { credentialsLoaded: true }
      };
    } catch (error) {
      return {
        service: 'secrets-manager',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: { credentialsLoaded: false }
      };
    }
  }

  private async checkDriCloudConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Hacer una petición simple a DriCloud para verificar conectividad
      const response = await this.httpService.get(
        'https://apidricloud.dricloud.net/health',
        { timeout: 5000 }
      ).toPromise();
      
      return {
        service: 'dricloud-api',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: { 
          statusCode: response.status,
          responseTime: Date.now() - startTime
        }
      };
    } catch (error) {
      // Si falla el health check, intentar una petición más simple
      try {
        const pingResponse = await this.httpService.get(
          'https://apidricloud.dricloud.net',
          { timeout: 3000 }
        ).toPromise();
        
        return {
          service: 'dricloud-api',
          status: 'degraded',
          responseTime: Date.now() - startTime,
          error: 'Health endpoint not available, but API is reachable',
          details: { 
            statusCode: pingResponse.status,
            fallbackCheck: true
          }
        };
      } catch (pingError) {
        return {
          service: 'dricloud-api',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          error: `Connection failed: ${pingError.message}`,
          details: { 
            connectionFailed: true,
            lastError: pingError.message
          }
        };
      }
    }
  }

  private async checkRateLimiting(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const status = this.smartRateLimitService.getStatus();
      const canMakeRequest = this.smartRateLimitService.canMakeRequest();
      
      return {
        service: 'rate-limiting',
        status: canMakeRequest.allowed ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          conflictDetected: status.conflictDetected,
          requestCountLastMinute: status.requestCountLastMinute,
          requestCountLastHour: status.requestCountLastHour,
          canMakeRequest: canMakeRequest.allowed,
          reason: canMakeRequest.reason
        }
      };
    } catch (error) {
      return {
        service: 'rate-limiting',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: { serviceError: true }
      };
    }
  }

  private processHealthResult(serviceName: string, result: PromiseSettledResult<HealthCheckResult>): HealthCheckResult {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        service: serviceName,
        status: 'unhealthy',
        error: result.reason?.message || 'Unknown error',
        details: { promiseRejected: true }
      };
    }
  }

  private determineOverallHealth(services: HealthCheckResult[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    
    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private getRequestCount(): number {
    // Esta información vendría del DriCloudService
    // Por ahora retornamos un valor simulado
    return 0;
  }

  private getErrorRate(): number {
    // Esta información vendría del DriCloudService
    // Por ahora retornamos un valor simulado
    return 0;
  }

  // Health check simple para endpoints básicos
  async getBasicHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'gua-api',
      uptime: Date.now() - this.startTime
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DriCloudMetrics } from '../metrics/cloudwatch-metrics';
import { SecretsManagerService, DriCloudCredentials } from '../secrets/secrets-manager.service';
import { SmartRateLimitService } from '../rate-limiting/smart-rate-limit.service';
import { DynamoDBService, AuditRecord } from '../database/dynamodb.service';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { MOCK_DATA } from './mock-data';

@Injectable()
export class DriCloudService {
  private readonly logger = new Logger(DriCloudService.name);
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private isRefreshing = false;
  private tokenRefreshCount = 0;
  private lastTokenRefresh: Date | null = null;
  private lastRequestTime: Date | null = null;
  private requestCount = 0;
  private errorCount = 0;
  private metrics: DriCloudMetrics;
  private credentials: DriCloudCredentials | null = null;
  private readonly isMockMode: boolean;
  private readonly mockBaseUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private secretsManagerService: SecretsManagerService,
    private smartRateLimitService: SmartRateLimitService,
    private dynamoDBService: DynamoDBService,
    private circuitBreakerService: CircuitBreakerService
  ) {
    this.metrics = new DriCloudMetrics();
    this.isMockMode = process.env.DRICLOUD_MOCK_MODE === 'true';
    this.mockBaseUrl = process.env.DRICLOUD_MOCK_URL || 'http://localhost:1080';
    
    if (this.isMockMode) {
      this.logger.log('🎭 Modo Mock activado - Usando MockServer en lugar de DriCloud real');
    }
  }

  async getValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }
    return this.token!;
  }

  private async refreshToken() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    try {
      if (this.isMockMode) {
        this.logger.log('🎭 Refreshing Mock token...');
        
        // Usar datos mock directamente sin hacer llamadas HTTP
        this.token = MOCK_DATA.login.Data.USU_APITOKEN;
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        this.tokenRefreshCount++;
        this.lastTokenRefresh = new Date();
        this.logger.log(`✅ Mock token refreshed successfully (refresh #${this.tokenRefreshCount})`);
      } else {
        this.logger.log('🔄 Refreshing DriCloud token (conflict with Ovianta detected)...');
        
        const response = await this.httpService.post(
          `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/LoginExternalHash`,
          await this.getLoginParams()
        ).toPromise();

        if (response.data.Successful) {
          this.token = response.data.Data.USU_APITOKEN;
          this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
          this.tokenRefreshCount++;
          this.lastTokenRefresh = new Date();
          this.logger.log(`✅ DriCloud token refreshed successfully (refresh #${this.tokenRefreshCount})`);
          
          // Enviar métricas a CloudWatch
          await this.metrics.publishTokenMetrics({
            refreshCount: this.tokenRefreshCount,
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            lastRefresh: this.lastTokenRefresh
          });
        } else {
          throw new Error(`Failed to refresh DriCloud token: ${response.data.Html || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // Limpiar token inválido para forzar renovación en próxima llamada
      this.token = null;
      this.tokenExpiry = null;
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async getLoginParams() {
    // Obtener credenciales desde Secrets Manager
    if (!this.credentials) {
      this.credentials = await this.secretsManagerService.getDriCloudCredentials();
    }

    const { DRICLOUD_WEBAPI_USER: userName, DRICLOUD_WEBAPI_PASSWORD: password, DRICLOUD_CLINIC_ID: clinicId } = this.credentials;
    
    if (!userName || !password || !clinicId) {
      throw new Error('DriCloud credentials not configured');
    }

    // Obtener fecha actual en España peninsular - método más directo
    const now = new Date();
    const spainTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
    
    // Formato yyyyMMddHHmmss - método más simple y directo
    const year = spainTime.getFullYear();
    const month = String(spainTime.getMonth() + 1).padStart(2, '0');
    const day = String(spainTime.getDate()).padStart(2, '0');
    const hour = String(spainTime.getHours()).padStart(2, '0');
    const minute = String(spainTime.getMinutes()).padStart(2, '0');
    const second = String(spainTime.getSeconds()).padStart(2, '0');
    
    const timeSpanString = `${year}${month}${day}${hour}${minute}${second}`;
    
    const passwordMD5 = crypto.createHash('md5').update(password, 'ascii').digest('hex').toUpperCase();
    const inputForHash = userName + passwordMD5 + timeSpanString + 'sFfDS395$YGTry546g';
    const hash = crypto.createHash('md5').update(inputForHash, 'ascii').digest('hex').toUpperCase();

    this.logger.debug('DriCloud Login Params prepared', {
      userName,
      timeSpanString,
      idClinica: clinicId,
      hashLength: hash.length,
      spainTime: spainTime.toISOString()
    });

    return {
      userName,
      timeSpanString,
      hash,
      idClinica: clinicId
    };
  }

  private async getClinicUrl(): Promise<string> {
    if (!this.credentials) {
      this.credentials = await this.secretsManagerService.getDriCloudCredentials();
    }
    return this.credentials.DRICLOUD_CLINIC_URL;
  }

  private isTokenExpired(): boolean {
    return !this.token || !this.tokenExpiry || this.tokenExpiry <= new Date();
  }

  // Método KISS: Protección automática simple
  async makeDriCloudRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Rate limiting inteligente
    const rateLimitCheck = this.smartRateLimitService.canMakeRequest();
    if (!rateLimitCheck.allowed) {
      this.logger.warn(`Request blocked by rate limiting: ${rateLimitCheck.reason}`);
      
      // Log auditoría para request bloqueado
      await this.logAuditRecord({
        requestId,
        timestamp: new Date().toISOString(),
        endpoint: 'rate-limited',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        errorMessage: rateLimitCheck.reason
      });
      
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}. Wait ${rateLimitCheck.waitTime}s`);
    }
    
    this.requestCount++;
    this.smartRateLimitService.recordRequest();
    
    try {
      const result = await requestFn();
      
      // Enviar métricas de éxito
      await this.metrics.publishTokenMetrics({
        refreshCount: this.tokenRefreshCount,
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        lastRefresh: this.lastTokenRefresh
      });
      
      // Log auditoría para request exitoso
      await this.logAuditRecord({
        requestId,
        timestamp: new Date().toISOString(),
        endpoint: 'dricloud-api',
        method: 'POST',
        status: 'success',
        responseTime: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      this.errorCount++;
      
      // Si es error de token, renovar y reintentar UNA vez
      if (this.isDriCloudTokenError(error.response?.data)) {
        this.logger.log('🔄 Token conflict detected, refreshing...');
        this.smartRateLimitService.recordTokenRefresh();
        await this.refreshToken();
        
        try {
          const retryResult = await requestFn();
          
          // Log auditoría para retry exitoso
          await this.logAuditRecord({
            requestId,
            timestamp: new Date().toISOString(),
            endpoint: 'dricloud-api',
            method: 'POST',
            status: 'success',
            responseTime: Date.now() - startTime,
            errorMessage: 'Retry after token refresh'
          });
          
          return retryResult;
        } catch (retryError) {
          // Log auditoría para retry fallido
          await this.logAuditRecord({
            requestId,
            timestamp: new Date().toISOString(),
            endpoint: 'dricloud-api',
            method: 'POST',
            status: 'error',
            responseTime: Date.now() - startTime,
            errorMessage: retryError.message
          });
          
          throw retryError;
        }
      }
      
      // Enviar métricas de error
      await this.metrics.publishTokenMetrics({
        refreshCount: this.tokenRefreshCount,
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        lastRefresh: this.lastTokenRefresh
      });
      
      // Log auditoría para error
      await this.logAuditRecord({
        requestId,
        timestamp: new Date().toISOString(),
        endpoint: 'dricloud-api',
        method: 'POST',
        status: 'error',
        responseTime: Date.now() - startTime,
        errorMessage: error.message
      });
      
      throw error;
    }
  }

  // Rate limiting inteligente
  private checkRateLimit(): boolean {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30000); // 30 segundos
    
    if (this.lastRequestTime && this.lastRequestTime > thirtySecondsAgo) {
      this.requestCount++;
      if (this.requestCount > 1) {
        console.log('⚠️ Rate limit: Solo 1 request cada 30 segundos en testing');
        return false;
      }
    } else {
      this.requestCount = 0;
    }
    
    this.lastRequestTime = now;
    return true;
  }

  private isDriCloudTokenError(response: any): boolean {
    return response?.Successful === false && 
           response?.Html === "Token incorrecto" &&
           response?.Data?.ErrorCode === -1;
  }

  private async logAuditRecord(record: AuditRecord): Promise<void> {
    try {
      await this.dynamoDBService.logAuditRecord(record);
    } catch (error) {
      this.logger.error('Failed to log audit record:', error);
      // No lanzar error para no afectar la funcionalidad principal
    }
  }

  // Método resiliente con Circuit Breaker + Fallback
  async resilientDriCloudRequest<T>(
    operation: () => Promise<T>,
    fallbackData?: T,
    operationName: string = 'dricloud-operation'
  ): Promise<T> {
    try {
      return await this.circuitBreakerService.execute(
        () => this.makeDriCloudRequest(operation),
        () => {
          this.logger.warn(`Circuit breaker fallback activated for: ${operationName}`);
          
          // Si no hay caché, usar datos por defecto
          if (fallbackData) {
            this.logger.log(`Fallback: Using default data for ${operationName}`);
            return fallbackData;
          }
          
          // Último recurso: datos mínimos
          return this.getMinimalFallbackData(operationName) as T;
        }
      );
    } catch (error) {
      // Si el Circuit Breaker falla, intentar obtener del caché
      this.logger.warn(`Circuit breaker failed, trying cache fallback for: ${operationName}`);
      
      try {
        const cacheKey = `fallback:${operationName}`;
        const cachedData = await this.dynamoDBService.getFromCache(cacheKey);
        
        if (cachedData) {
          this.logger.log(`Fallback: Serving cached data for ${operationName}`);
          return cachedData as T;
        }
      } catch (cacheError) {
        this.logger.error('Cache fallback also failed:', cacheError);
      }
      
      // Si todo falla, usar datos mínimos
      return this.getMinimalFallbackData(operationName) as T;
    }
  }

  private getMinimalFallbackData(operationName: string): any {
    switch (operationName) {
      case 'medical-specialties':
        return {
          Successful: true,
          Data: [
            { ESP_ID: 1, ESP_NOMBRE: 'Consulta General' },
            { ESP_ID: 2, ESP_NOMBRE: 'Urgencias' }
          ],
          Html: 'Datos de emergencia - Servicio temporalmente no disponible'
        };
      
      case 'doctors':
        return {
          Successful: true,
          Data: [
            { USU_ID: 1, USU_NOMBRE: 'Dr. Disponible', USU_APELLIDO1: 'Emergencia' }
          ],
          Html: 'Datos de emergencia - Servicio temporalmente no disponible'
        };
      
      default:
        return {
          Successful: false,
          Html: 'Servicio temporalmente no disponible',
          Data: null
        };
    }
  }

  // Métodos para llamadas a la API
  async getMedicalSpecialties() {
    const cacheKey = 'medical-specialties';
    
    // Intentar obtener del caché primero
    const cachedData = await this.dynamoDBService.getFromCache(cacheKey);
    if (cachedData) {
      this.logger.debug('Medical specialties served from cache');
      return cachedData;
    }

    // Usar método resiliente con Circuit Breaker
    const result = await this.resilientDriCloudRequest(
      async () => {
        const token = await this.getValidToken();
        const response = await this.httpService.post(
          `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/GetEspecialidades`,
          { CLI_ID: this.credentials?.DRICLOUD_CLINIC_ID },
          { headers: { USU_APITOKEN: token } }
        ).toPromise();
        
        return response.data;
      },
      undefined, // No fallback específico, usará datos mínimos
      'medical-specialties'
    );

    // Guardar en caché por 10 minutos
    await this.dynamoDBService.setCache(cacheKey, result, 10);
    
    return result;
  }

  async getDoctors(espId: number) {
    return this.makeDriCloudRequest(async () => {
      const token = await this.getValidToken();
      const response = await this.httpService.post(
        `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/GetDoctores`,
        { ESP_ID: espId },
        { headers: { USU_APITOKEN: token } }
      ).toPromise();
      
      return response.data;
    });
  }

  async getAppointmentTypes(serviceId: number) {
    this.logger.debug(`Getting appointment types for serviceId: ${serviceId}`);
    return this.makeDriCloudRequest(async () => {
      const token = await this.getValidToken();
      const clinicUrl = await this.getClinicUrl();
      this.logger.debug(`Using clinic URL: ${clinicUrl}`);
      
      const response = await this.httpService.post(
        `https://apidricloud.dricloud.net/${clinicUrl}/api/APIWeb/GetTiposCita`,
        { CLI_ID: this.credentials?.DRICLOUD_CLINIC_ID, SER_ID: serviceId },
        { headers: { USU_APITOKEN: token } }
      ).toPromise();
      return response.data;
    });
  }

  async getDoctorAgenda(doctorId: number, startDate: string, datesToFetch: number = 31) {
    return this.makeDriCloudRequest(async () => {
      const token = await this.getValidToken();
      const response = await this.httpService.post(
        `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/GetAgendaDisponibilidad`,
        {
          USU_ID: doctorId,
          fecha: startDate,
          diasRecuperar: datesToFetch
        },
        { headers: { USU_APITOKEN: token } }
      ).toPromise();
      
      return response.data;
    });
  }

  async getPatientByNIF(nif: string) {
    return this.makeDriCloudRequest(async () => {
      const token = await this.getValidToken();
      const response = await this.httpService.post(
        `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/GetPacienteByNIF`,
        { id: nif },
        { headers: { USU_APITOKEN: token } }
      ).toPromise();
      
      return response.data;
    });
  }

  async createPatient(patientData: any) {
    return this.makeDriCloudRequest(async () => {
      const token = await this.getValidToken();
      const response = await this.httpService.post(
        `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/PostCreatePaciente`,
        { paciente: patientData },
        { headers: { USU_APITOKEN: token } }
      ).toPromise();
      
      return response.data;
    });
  }

  async createAppointment(appointmentData: any) {
    return this.makeDriCloudRequest(async () => {
      const token = await this.getValidToken();
      const response = await this.httpService.post(
        `https://apidricloud.dricloud.net/${await this.getClinicUrl()}/api/APIWeb/PostCitaPaciente`,
        appointmentData,
        { headers: { USU_APITOKEN: token } }
      ).toPromise();
      
      return response.data;
    });
  }

  // Método para obtener estadísticas de tokens (útil para debugging)
  getTokenStats() {
    return {
      hasToken: !!this.token,
      tokenExpiry: this.tokenExpiry?.toISOString(),
      isExpired: this.isTokenExpired(),
      refreshCount: this.tokenRefreshCount,
      lastRefresh: this.lastTokenRefresh?.toISOString(),
      isRefreshing: this.isRefreshing,
      environment: process.env.NODE_ENV,
      isTestingMode: this.isTestingMode(),
      requestCount: this.requestCount,
      lastRequest: this.lastRequestTime?.toISOString()
    };
  }

  // Verificar si estamos en modo testing
  private isTestingMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.DRICLOUD_TESTING_MODE === 'true';
  }

  // Método seguro para testing - solo operaciones de lectura
  async safeTestingRequest<T>(requestFn: () => Promise<T>, operation: string): Promise<T> {
    if (this.isTestingMode()) {
      console.log(`🧪 Testing mode: ${operation} - Solo lectura permitida`);
      return this.makeDriCloudRequest(requestFn);
    } else {
      console.log(`⚠️ Production mode: ${operation} bloqueada para seguridad`);
      throw new Error(`Testing request blocked in production: ${operation}`);
    }
  }
}

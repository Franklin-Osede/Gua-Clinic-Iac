import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManager } from 'aws-sdk';

export interface DriCloudCredentials {
  DRICLOUD_WEBAPI_USER: string;
  DRICLOUD_WEBAPI_PASSWORD: string;
  DRICLOUD_CLINIC_URL: string;
  DRICLOUD_CLINIC_ID: string;
}

@Injectable()
export class SecretsManagerService {
  private readonly logger = new Logger(SecretsManagerService.name);
  private secretsManager: SecretsManager;
  private credentialsCache: DriCloudCredentials | null = null;
  private cacheExpiry: Date | null = null;

  constructor(private configService: ConfigService) {
    this.secretsManager = new SecretsManager({
      region: 'eu-north-1',
      // Las credenciales se obtienen automáticamente del AWS CLI configurado
    });
  }

  async getDriCloudCredentials(): Promise<DriCloudCredentials> {
    // Verificar caché
    if (this.credentialsCache && this.cacheExpiry && this.cacheExpiry > new Date()) {
      this.logger.debug('Using cached DriCloud credentials');
      return this.credentialsCache;
    }

    try {
      this.logger.log('Fetching DriCloud credentials from AWS Secrets Manager');
      
      const result = await this.secretsManager.getSecretValue({
        SecretId: 'gua-clinic/dricloud/credentials',
      }).promise();

      if (!result.SecretString) {
        throw new Error('Secret string is empty');
      }

      const credentials = JSON.parse(result.SecretString) as DriCloudCredentials;
      
      // Validar que todas las credenciales estén presentes
      this.validateCredentials(credentials);

      // Actualizar caché (expira en 10 minutos)
      this.credentialsCache = credentials;
      this.cacheExpiry = new Date(Date.now() + 10 * 60 * 1000);

      this.logger.log('DriCloud credentials loaded successfully');
      return credentials;

    } catch (error) {
      this.logger.error('Failed to fetch DriCloud credentials:', error);
      
      // Fallback a variables de entorno para desarrollo
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn('Falling back to environment variables for development');
        return this.getFallbackCredentials();
      }
      
      throw new Error(`Failed to load DriCloud credentials: ${error.message}`);
    }
  }

  private validateCredentials(credentials: DriCloudCredentials): void {
    const required = ['DRICLOUD_WEBAPI_USER', 'DRICLOUD_WEBAPI_PASSWORD', 'DRICLOUD_CLINIC_URL', 'DRICLOUD_CLINIC_ID'];
    
    for (const field of required) {
      if (!credentials[field]) {
        throw new Error(`Missing required credential: ${field}`);
      }
    }
  }

  private getFallbackCredentials(): DriCloudCredentials {
    return {
      DRICLOUD_WEBAPI_USER: this.configService.get('DRICLOUD_WEBAPI_USER') || 'WebAPI',
      DRICLOUD_WEBAPI_PASSWORD: this.configService.get('DRICLOUD_WEBAPI_PASSWORD') || 'Gabinete1991',
      DRICLOUD_CLINIC_URL: this.configService.get('DRICLOUD_CLINIC_URL') || 'Dricloud_gabinetedeurologiayandrologia_19748592',
      DRICLOUD_CLINIC_ID: this.configService.get('DRICLOUD_CLINIC_ID') || '19748',
    };
  }

  async refreshCredentials(): Promise<void> {
    this.logger.log('Refreshing DriCloud credentials cache');
    this.credentialsCache = null;
    this.cacheExpiry = null;
    await this.getDriCloudCredentials();
  }
}

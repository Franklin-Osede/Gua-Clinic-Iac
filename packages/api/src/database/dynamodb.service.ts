import { Injectable, Logger } from '@nestjs/common';
import { DynamoDB } from 'aws-sdk';

export interface AuditRecord {
  requestId: string;
  timestamp: string;
  userId?: string;
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  responseTime?: number;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CacheRecord {
  cacheKey: string;
  data: any;
  ttl: number; // Unix timestamp
  createdAt: string;
  hitCount?: number;
}

@Injectable()
export class DynamoDBService {
  private readonly logger = new Logger(DynamoDBService.name);
  private dynamoDB: DynamoDB.DocumentClient;

  constructor() {
    this.dynamoDB = new DynamoDB.DocumentClient({
      region: 'eu-north-1',
      // Las credenciales se obtienen automáticamente del AWS CLI configurado
    });
  }

  // ===== AUDITORÍA =====
  
  async logAuditRecord(record: AuditRecord): Promise<void> {
    try {
      const params = {
        TableName: 'gua-clinic-audit',
        Item: {
          ...record,
          createdAt: new Date().toISOString(),
          // TTL para eliminar registros después de 30 días
          ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        }
      };

      await this.dynamoDB.put(params).promise();
      this.logger.debug(`Audit record logged: ${record.requestId}`);
    } catch (error) {
      this.logger.error('Failed to log audit record:', error);
      // No lanzar error para no afectar la funcionalidad principal
    }
  }

  async getAuditRecords(
    startDate?: string, 
    endDate?: string, 
    limit: number = 100
  ): Promise<AuditRecord[]> {
    try {
      const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: 'gua-clinic-audit',
        Limit: limit
      };

      if (startDate && endDate) {
        params.FilterExpression = 'timestamp BETWEEN :startDate AND :endDate';
        params.ExpressionAttributeValues = {
          ':startDate': startDate,
          ':endDate': endDate
        };
      }

      const result = await this.dynamoDB.scan(params).promise();
      return result.Items as AuditRecord[];
    } catch (error) {
      this.logger.error('Failed to get audit records:', error);
      return [];
    }
  }

  // ===== CACHÉ =====

  async getFromCache<T>(cacheKey: string): Promise<T | null> {
    try {
      const params = {
        TableName: 'gua-clinic-cache',
        Key: { cacheKey }
      };

      const result = await this.dynamoDB.get(params).promise();
      
      if (result.Item) {
        // Incrementar contador de hits
        await this.incrementCacheHitCount(cacheKey);
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return result.Item.data as T;
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error('Failed to get from cache:', error);
      return null;
    }
  }

  async setCache<T>(
    cacheKey: string, 
    data: T, 
    ttlMinutes: number = 5
  ): Promise<void> {
    try {
      const ttl = Math.floor(Date.now() / 1000) + (ttlMinutes * 60);
      
      const params = {
        TableName: 'gua-clinic-cache',
        Item: {
          cacheKey,
          data,
          ttl,
          createdAt: new Date().toISOString(),
          hitCount: 0
        }
      };

      await this.dynamoDB.put(params).promise();
      this.logger.debug(`Data cached with key: ${cacheKey}, TTL: ${ttlMinutes} minutes`);
    } catch (error) {
      this.logger.error('Failed to set cache:', error);
      // No lanzar error para no afectar la funcionalidad principal
    }
  }

  async deleteFromCache(cacheKey: string): Promise<void> {
    try {
      const params = {
        TableName: 'gua-clinic-cache',
        Key: { cacheKey }
      };

      await this.dynamoDB.delete(params).promise();
      this.logger.debug(`Cache entry deleted: ${cacheKey}`);
    } catch (error) {
      this.logger.error('Failed to delete from cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      // Obtener todas las claves
      const scanParams = {
        TableName: 'gua-clinic-cache',
        ProjectionExpression: 'cacheKey'
      };

      const result = await this.dynamoDB.scan(scanParams).promise();
      
      // Eliminar en lotes
      if (result.Items && result.Items.length > 0) {
        const deleteRequests = result.Items.map(item => ({
          DeleteRequest: { Key: { cacheKey: item.cacheKey } }
        }));

        const batchParams = {
          RequestItems: {
            'gua-clinic-cache': deleteRequests
          }
        };

        await this.dynamoDB.batchWrite(batchParams).promise();
        this.logger.log(`Cache cleared: ${result.Items.length} entries deleted`);
      }
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
    }
  }

  private async incrementCacheHitCount(cacheKey: string): Promise<void> {
    try {
      const params = {
        TableName: 'gua-clinic-cache',
        Key: { cacheKey },
        UpdateExpression: 'ADD hitCount :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        }
      };

      await this.dynamoDB.update(params).promise();
    } catch (error) {
      // No es crítico si falla
      this.logger.debug('Failed to increment cache hit count:', error);
    }
  }

  // ===== IDEMPOTENCIA =====

  async checkIdempotency(requestId: string): Promise<boolean> {
    try {
      const params = {
        TableName: 'gua-clinic-cache',
        Key: { cacheKey: `idempotency:${requestId}` }
      };

      const result = await this.dynamoDB.get(params).promise();
      return !!result.Item;
    } catch (error) {
      this.logger.error('Failed to check idempotency:', error);
      return false;
    }
  }

  async setIdempotency(requestId: string, ttlMinutes: number = 5): Promise<void> {
    try {
      const ttl = Math.floor(Date.now() / 1000) + (ttlMinutes * 60);
      
      const params = {
        TableName: 'gua-clinic-cache',
        Item: {
          cacheKey: `idempotency:${requestId}`,
          data: { processed: true },
          ttl,
          createdAt: new Date().toISOString()
        }
      };

      await this.dynamoDB.put(params).promise();
      this.logger.debug(`Idempotency set for request: ${requestId}`);
    } catch (error) {
      this.logger.error('Failed to set idempotency:', error);
    }
  }

  // ===== ESTADÍSTICAS =====

  async getCacheStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    averageHitsPerEntry: number;
  }> {
    try {
      const params = {
        TableName: 'gua-clinic-cache',
        ProjectionExpression: 'hitCount'
      };

      const result = await this.dynamoDB.scan(params).promise();
      
      const totalEntries = result.Items?.length || 0;
      const totalHits = result.Items?.reduce((sum, item) => sum + (item.hitCount || 0), 0) || 0;
      const averageHitsPerEntry = totalEntries > 0 ? totalHits / totalEntries : 0;

      return {
        totalEntries,
        totalHits,
        averageHitsPerEntry
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        averageHitsPerEntry: 0
      };
    }
  }
}

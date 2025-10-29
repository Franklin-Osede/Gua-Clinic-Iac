import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { DynamoDBService } from '../database/dynamodb.service';

export interface SessionData {
  sessionId: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_DURATION_MINUTES = 30;
  private readonly SESSION_CACHE_KEY_PREFIX = 'session:';

  constructor(private readonly dynamoDBService: DynamoDBService) {}

  /**
   * Genera una nueva sesión y la guarda en DynamoDB
   */
  async createSession(ipAddress?: string, userAgent?: string): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION_MINUTES * 60 * 1000);

    const session: SessionData = {
      sessionId,
      expiresAt,
      createdAt: now,
      ipAddress,
      userAgent,
    };

    // Guardar en DynamoDB con TTL
    const cacheKey = `${this.SESSION_CACHE_KEY_PREFIX}${sessionId}`;
    await this.dynamoDBService.setCache<SessionData>(
      cacheKey,
      session,
      this.SESSION_DURATION_MINUTES
    );

    this.logger.debug(`Session created: ${sessionId}, expires at: ${expiresAt.toISOString()}`);

    return session;
  }

  /**
   * Valida una sesión desde DynamoDB
   */
  async validateSession(sessionId: string): Promise<SessionData | null> {
    try {
      const cacheKey = `${this.SESSION_CACHE_KEY_PREFIX}${sessionId}`;
      const session = await this.dynamoDBService.getFromCache<SessionData>(cacheKey);

      if (!session) {
        this.logger.debug(`Session not found: ${sessionId}`);
        return null;
      }

      // Convertir fechas de string a Date si vienen de DynamoDB
      if (session.expiresAt && typeof session.expiresAt === 'string') {
        session.expiresAt = new Date(session.expiresAt);
      }
      if (session.createdAt && typeof session.createdAt === 'string') {
        session.createdAt = new Date(session.createdAt);
      }

      // Verificar si la sesión expiró (doble verificación con TTL de DynamoDB)
      if (new Date(session.expiresAt) < new Date()) {
        this.logger.debug(`Session expired: ${sessionId}`);
        await this.dynamoDBService.deleteFromCache(cacheKey);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error(`Failed to validate session: ${sessionId}`, error);
      return null;
    }
  }

  /**
   * Renueva una sesión existente
   */
  async renewSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.validateSession(sessionId);

    if (!session) {
      return null;
    }

    // Asegurar que createdAt esté definido (puede faltar en sesiones antiguas)
    if (!session.createdAt) {
      session.createdAt = new Date();
    } else if (typeof session.createdAt === 'string') {
      session.createdAt = new Date(session.createdAt);
    }

    // Renovar expiración
    session.expiresAt = new Date(
      new Date().getTime() + this.SESSION_DURATION_MINUTES * 60 * 1000,
    );

    // Guardar sesión renovada en DynamoDB
    const cacheKey = `${this.SESSION_CACHE_KEY_PREFIX}${sessionId}`;
    await this.dynamoDBService.setCache<SessionData>(
      cacheKey,
      session,
      this.SESSION_DURATION_MINUTES
    );

    this.logger.debug(`Session renewed: ${sessionId}, new expires at: ${session.expiresAt.toISOString()}`);

    return session;
  }

  /**
   * Elimina una sesión
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const cacheKey = `${this.SESSION_CACHE_KEY_PREFIX}${sessionId}`;
      await this.dynamoDBService.deleteFromCache(cacheKey);
      this.logger.debug(`Session deleted: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to delete session: ${sessionId}`, error);
    }
  }

  /**
   * Genera un ID de sesión único y seguro
   */
  private generateSessionId(): string {
    return `gua_session_${crypto.randomBytes(32).toString('hex')}`;
  }
}


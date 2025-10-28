import { Injectable, Logger } from '@nestjs/common';

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  conflictDetectionWindow: number; // minutos
  conflictThreshold: number; // número de renovaciones que indican conflicto
}

@Injectable()
export class SmartRateLimitService {
  private readonly logger = new Logger(SmartRateLimitService.name);
  
  private requestHistory: Array<{ timestamp: Date; type: 'request' | 'refresh' }> = [];
  private conflictDetected = false;
  private conflictStartTime: Date | null = null;
  
  private readonly config: RateLimitConfig = {
    maxRequestsPerMinute: 10, // Máximo 10 requests por minuto
    maxRequestsPerHour: 100,  // Máximo 100 requests por hora
    conflictDetectionWindow: 5, // Ventana de 5 minutos para detectar conflictos
    conflictThreshold: 3,     // 3 renovaciones en 5 min = conflicto
  };

  canMakeRequest(): { allowed: boolean; reason?: string; waitTime?: number } {
    const now = new Date();
    
    // Limpiar historial antiguo (más de 1 hora)
    this.cleanOldHistory(now);
    
    // Verificar límites básicos
    const minuteCount = this.getRequestCountInWindow(now, 1);
    const hourCount = this.getRequestCountInWindow(now, 60);
    
    if (minuteCount >= this.config.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${minuteCount}/${this.config.maxRequestsPerMinute} requests per minute`,
        waitTime: 60 // Esperar 1 minuto
      };
    }
    
    if (hourCount >= this.config.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${hourCount}/${this.config.maxRequestsPerHour} requests per hour`,
        waitTime: 3600 // Esperar 1 hora
      };
    }
    
    // Verificar si estamos en modo conflicto
    if (this.conflictDetected) {
      const conflictDuration = now.getTime() - this.conflictStartTime!.getTime();
      const conflictWindowMs = this.config.conflictDetectionWindow * 60 * 1000;
      
      if (conflictDuration < conflictWindowMs) {
        return {
          allowed: false,
          reason: 'Conflict with Ovianta detected - throttling requests',
          waitTime: Math.max(30, conflictWindowMs - conflictDuration) / 1000 // Esperar al menos 30 segundos
        };
      } else {
        // Salir del modo conflicto
        this.conflictDetected = false;
        this.conflictStartTime = null;
        this.logger.log('Exiting conflict mode - resuming normal operations');
      }
    }
    
    return { allowed: true };
  }

  recordRequest(): void {
    this.requestHistory.push({ timestamp: new Date(), type: 'request' });
  }

  recordTokenRefresh(): void {
    this.requestHistory.push({ timestamp: new Date(), type: 'refresh' });
    
    // Verificar si hay conflicto
    this.checkForConflict();
  }

  private checkForConflict(): void {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.conflictDetectionWindow * 60 * 1000);
    
    const refreshCount = this.requestHistory.filter(entry => 
      entry.type === 'refresh' && entry.timestamp >= windowStart
    ).length;
    
    if (refreshCount >= this.config.conflictThreshold) {
      if (!this.conflictDetected) {
        this.conflictDetected = true;
        this.conflictStartTime = now;
        this.logger.warn(`Conflict detected: ${refreshCount} token refreshes in ${this.config.conflictDetectionWindow} minutes`);
        
        // Enviar alerta a CloudWatch
        this.sendConflictAlert(refreshCount);
      }
    }
  }

  private getRequestCountInWindow(now: Date, windowMinutes: number): number {
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
    return this.requestHistory.filter(entry => 
      entry.type === 'request' && entry.timestamp >= windowStart
    ).length;
  }

  private cleanOldHistory(now: Date): void {
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    this.requestHistory = this.requestHistory.filter(entry => entry.timestamp >= oneHourAgo);
  }

  private sendConflictAlert(refreshCount: number): void {
    // Esta función se integrará con CloudWatch más adelante
    this.logger.error(`CONFLICT ALERT: ${refreshCount} token refreshes detected - possible conflict with Ovianta`);
  }

  getStatus(): {
    conflictDetected: boolean;
    requestCountLastMinute: number;
    requestCountLastHour: number;
    conflictStartTime: Date | null;
  } {
    const now = new Date();
    return {
      conflictDetected: this.conflictDetected,
      requestCountLastMinute: this.getRequestCountInWindow(now, 1),
      requestCountLastHour: this.getRequestCountInWindow(now, 60),
      conflictStartTime: this.conflictStartTime,
    };
  }
}

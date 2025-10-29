import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { BootstrapService } from './bootstrap.service';

@ApiTags('bootstrap')
@Controller('bootstrap')
export class BootstrapController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly bootstrapService: BootstrapService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Bootstrap endpoint',
    description: 'Returns session data and initial configuration. Creates a new session with httpOnly cookie.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Bootstrap data retrieved successfully'
  })
  async getBootstrap(@Req() req: Request, @Res() res: Response) {
    // Obtener cookie de sesión si existe
    const existingSessionId = req.cookies?.sessionId;
    
    let session;
    
    // Si hay sesión válida, intentar renovarla
    if (existingSessionId) {
      session = await this.sessionService.renewSession(existingSessionId);
    }
    
    // Si no hay sesión válida, crear una nueva
    if (!session) {
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      session = await this.sessionService.createSession(ipAddress, userAgent);
    }

    // Establecer cookie httpOnly
    res.cookie('sessionId', session.sessionId, {
      httpOnly: true, // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Protección CSRF
      maxAge: 30 * 60 * 1000, // 30 minutos
      path: '/', // Disponible en toda la aplicación
    });

    // Devolver datos de bootstrap con información de sesión
    const bootstrapData = this.bootstrapService.getBootstrapData();
    
    // Asegurar que las fechas sean objetos Date válidos antes de llamar toISOString()
    let expiresAt: Date;
    let createdAt: Date;
    
    try {
      if (session.expiresAt instanceof Date && !isNaN(session.expiresAt.getTime())) {
        expiresAt = session.expiresAt;
      } else if (typeof session.expiresAt === 'string') {
        expiresAt = new Date(session.expiresAt);
        if (isNaN(expiresAt.getTime())) {
          throw new Error(`Invalid expiresAt: ${session.expiresAt}`);
        }
      } else {
        // Fallback: crear nueva fecha de expiración
        expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      }
    } catch (error) {
      // Fallback: crear nueva fecha de expiración
      expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    }
    
    try {
      if (session.createdAt instanceof Date && !isNaN(session.createdAt.getTime())) {
        createdAt = session.createdAt;
      } else if (typeof session.createdAt === 'string') {
        createdAt = new Date(session.createdAt);
        if (isNaN(createdAt.getTime())) {
          throw new Error(`Invalid createdAt: ${session.createdAt}`);
        }
      } else {
        // Fallback: usar fecha actual
        createdAt = new Date();
      }
    } catch (error) {
      // Fallback: usar fecha actual
      createdAt = new Date();
    }
    
    return res.json({
      session: {
        id: session.sessionId,
        expiresAt: expiresAt.toISOString(),
        createdAt: createdAt.toISOString(),
        locale: bootstrapData.session.locale,
        theme: bootstrapData.session.theme,
      },
      config: bootstrapData.config,
      timestamp: new Date().toISOString(),
    });
  }
}

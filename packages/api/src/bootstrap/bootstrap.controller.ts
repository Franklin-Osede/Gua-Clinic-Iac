import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { BootstrapService } from './bootstrap.service'

@Controller('bootstrap')
export class BootstrapController {
  constructor(private readonly bootstrapService: BootstrapService) {}

  @Get()
  async bootstrap(@Res({ passthrough: true }) res: Response) {
    const sessionData = await this.bootstrapService.createSession()
    
    // Configurar cookie HttpOnly
    res.cookie('session', sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos
    })

    return {
      locale: sessionData.locale,
      theme: sessionData.theme,
      features: sessionData.features,
    }
  }
}

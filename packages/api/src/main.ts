import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { API_VERSION, API_NAME, API_DESCRIPTION } from './common/version'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Configurar cookie parser (debe ir antes de CORS)
  app.use(cookieParser())

  // Configurar CORS según entorno
  const isProduction = process.env.NODE_ENV === 'production';
  
  let allowedOrigins: string[] = [];
  
  if (isProduction) {
    // En producción, solo orígenes específicos
    allowedOrigins = [
      'https://urologiayandrologia.com',
      'https://www.urologiayandrologia.com',
      'https://www.guaclinic.com',
      'https://guaclinic.com',
      'https://cdn.gua.com',
    ];
  } else {
    // En desarrollo, incluir localhost + archivos locales
    allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:8080',
      'http://localhost:8081',
      'https://cdn.gua.com',
      'null' // Solo en desarrollo para archivos locales
    ];
  }
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'USU_APITOKEN'],
  })

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))

  // Configurar headers de seguridad
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    next()
  })

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle(API_NAME)
    .setDescription(API_DESCRIPTION)
    .setVersion(API_VERSION)
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.guaclinic.com', 'Production Server')
    .addTag('medical-specialties', 'Gestión de especialidades médicas')
    .addTag('appointments-types', 'Tipos de citas médicas')
    .addTag('doctors', 'Gestión de doctores')
    .addTag('doctor-availability', 'Disponibilidad de doctores')
    .addTag('bootstrap', 'Configuración inicial del widget')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })

  const port = process.env.PORT || 3000
  await app.listen(port)
  
  console.log(`🚀 GUA API running on port ${port}`)
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`)
}

bootstrap()

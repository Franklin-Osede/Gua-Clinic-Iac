import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common'
import { CreateAppointmentDto } from './dto/create-appointment.dto'
import { DriCloudService } from '../dricloud/dricloud.service'
import { DynamoDBService } from '../database/dynamodb.service'
import * as crypto from 'crypto';

export type AppointmentStatus = 'pending' | 'processing' | 'confirmed' | 'failed';

export interface AppointmentStatusData {
  appointmentId: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private driCloudService: DriCloudService,
    private dynamoDBService: DynamoDBService,
  ) {}

  async createAppointment(createAppointmentDto: CreateAppointmentDto, requestId?: string) {
    // Si hay requestId, verificar idempotencia
    if (requestId) {
      const existingResponse = await this.dynamoDBService.getIdempotentResponse(requestId);
      
      if (existingResponse) {
        this.logger.debug(`Idempotent request detected: ${requestId}, returning cached response`);
        return existingResponse;
      }
    }

    // Generar ID único para tracking
    const appointmentId = `appt_${crypto.randomUUID()}`;
    
    // Guardar estado inicial en DynamoDB
    const statusData: AppointmentStatusData = {
      appointmentId,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Guardar en DynamoDB con TTL de 1 hora (por si falla, no queda ahí para siempre)
    await this.dynamoDBService.setCache<AppointmentStatusData>(
      `appointment_status:${appointmentId}`,
      statusData,
      60 // 1 hora TTL
    );

    try {
      // DriCloudService ya tiene protección automática
      const response = await this.driCloudService.createAppointment(createAppointmentDto)
      
      if (response.Successful) {
        // Actualizar estado a confirmado
        const confirmedStatus: AppointmentStatusData = {
          appointmentId,
          status: 'confirmed',
          createdAt: statusData.createdAt,
          updatedAt: new Date().toISOString(),
        };

        await this.dynamoDBService.setCache<AppointmentStatusData>(
          `appointment_status:${appointmentId}`,
          confirmedStatus,
          60
        );

        const result = {
          appointmentId: response.Data.CPA_ID,
          trackingId: appointmentId, // ID interno para tracking
          message: 'Cita creada exitosamente',
          appointment: {
            ...createAppointmentDto,
            id: response.Data.CPA_ID,
            status: 'confirmed',
            createdAt: new Date().toISOString()
          }
        };

        // Guardar respuesta para idempotencia (si hay requestId)
        if (requestId) {
          await this.dynamoDBService.setIdempotency(requestId, result, 10); // 10 minutos TTL
        }

        return result;
      } else {
        // Actualizar estado a fallido
        const failedStatus: AppointmentStatusData = {
          appointmentId,
          status: 'failed',
          createdAt: statusData.createdAt,
          updatedAt: new Date().toISOString(),
          errorMessage: response.Html || 'Error desconocido',
        };

        await this.dynamoDBService.setCache<AppointmentStatusData>(
          `appointment_status:${appointmentId}`,
          failedStatus,
          60
        );

        throw new Error(response.Html || 'Error al crear cita en DriCloud')
      }
    } catch (error) {
      // Actualizar estado a fallido si hay excepción
      const failedStatus: AppointmentStatusData = {
        appointmentId,
        status: 'failed',
        createdAt: statusData.createdAt,
        updatedAt: new Date().toISOString(),
        errorMessage: error.message,
      };

      await this.dynamoDBService.setCache<AppointmentStatusData>(
        `appointment_status:${appointmentId}`,
        failedStatus,
        60
      );

      throw error;
    }
  }

  async getAppointmentStatus(appointmentId: string): Promise<AppointmentStatusData> {
    const statusData = await this.dynamoDBService.getFromCache<AppointmentStatusData>(
      `appointment_status:${appointmentId}`
    );

    if (!statusData) {
      throw new NotFoundException(`Estado de cita no encontrado: ${appointmentId}`);
    }

    return statusData;
  }
}


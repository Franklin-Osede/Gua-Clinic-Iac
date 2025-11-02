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
      // Transformar el DTO al formato que espera DriCloud API v2.3
      const dricloudAppointmentData = this.transformToDriCloudFormat(createAppointmentDto);
      
      this.logger.debug('Appointment data transformed for DriCloud:', dricloudAppointmentData);
      
      // DriCloudService ya tiene protección automática
      const response = await this.driCloudService.createAppointment(dricloudAppointmentData)
      
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

  /**
   * Transforma el DTO interno al formato que espera DriCloud API v2.3
   * Según documentación: PostCitaPaciente necesita:
   * - USU_ID: int
   * - fechaInicioCitaString: string en formato "yyyyMMddHHmm"
   * - PAC_ID: int
   * - TCI_ID: int (opcional)
   * - DES_ID: int (opcional)
   * - CLI_ID: int (opcional)
   * - observaciones: string (opcional)
   */
  private transformToDriCloudFormat(dto: CreateAppointmentDto): any {
    // Convertir FECHA (YYYY-MM-DD) + HORA (HH:MM) a fechaInicioCitaString (yyyyMMddHHmm)
    const fechaParts = dto.FECHA.split('-');
    const horaParts = dto.HORA.split(':');
    
    if (fechaParts.length !== 3 || horaParts.length !== 2) {
      throw new BadRequestException('Formato de fecha u hora inválido. Fecha debe ser YYYY-MM-DD y hora HH:MM');
    }

    const [year, month, day] = fechaParts;
    const [hour, minute] = horaParts;
    
    const fechaInicioCitaString = `${year}${month}${day}${hour}${minute}`;

    // Construir objeto según documentación DriCloud
    const dricloudData: any = {
      USU_ID: dto.USU_ID,
      fechaInicioCitaString: fechaInicioCitaString,
      PAC_ID: dto.PAC_ID,
    };

    // Campos opcionales según documentación
    if (dto.TCI_ID) {
      dricloudData.TCI_ID = dto.TCI_ID;
    }

    if (dto.DES_ID) {
      dricloudData.DES_ID = dto.DES_ID;
    }

    if (dto.CLI_ID) {
      dricloudData.CLI_ID = dto.CLI_ID;
    }

    if (dto.OBSERVACIONES) {
      dricloudData.observaciones = dto.OBSERVACIONES;
    }

    return dricloudData;
  }
}


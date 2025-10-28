import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EncryptedPatientDto {
  @ApiProperty({
    description: 'Datos del paciente encriptados',
    example: 'encrypted_patient_data_string'
  })
  @IsString()
  @IsNotEmpty()
  encryptedData: string;

  @ApiProperty({
    description: 'Metadatos adicionales (opcional)',
    example: { source: 'web', version: '1.0' },
    required: false
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
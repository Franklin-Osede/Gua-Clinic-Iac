import { IsNumber, IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID del paciente',
    example: 123
  })
  @IsNumber()
  @IsNotEmpty()
  PAC_ID: number;

  @ApiProperty({
    description: 'ID del doctor',
    example: 456
  })
  @IsNumber()
  @IsNotEmpty()
  USU_ID: number;

  @ApiProperty({
    description: 'ID del tipo de cita',
    example: 789
  })
  @IsNumber()
  @IsNotEmpty()
  TIP_ID: number;

  @ApiProperty({
    description: 'Fecha de la cita (YYYY-MM-DD)',
    example: '2024-01-15'
  })
  @IsDateString()
  @IsNotEmpty()
  FECHA: string;

  @ApiProperty({
    description: 'Hora de la cita (HH:MM)',
    example: '10:30'
  })
  @IsString()
  @IsNotEmpty()
  HORA: string;

  @ApiProperty({
    description: 'Observaciones adicionales (opcional)',
    example: 'Primera consulta',
    required: false
  })
  @IsString()
  @IsOptional()
  OBSERVACIONES?: string;

  @ApiProperty({
    description: 'Tipo de cita (presencial/virtual)',
    example: 'presencial',
    required: false
  })
  @IsString()
  @IsOptional()
  TIPO_CITA?: string;
}
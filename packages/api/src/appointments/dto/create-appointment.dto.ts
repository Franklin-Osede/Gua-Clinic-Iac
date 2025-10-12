import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean } from 'class-validator'

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID del paciente',
    example: 123,
    type: 'number'
  })
  @IsNumber()
  patientId: number

  @ApiProperty({
    description: 'ID del doctor',
    example: 456,
    type: 'number'
  })
  @IsNumber()
  doctorId: number

  @ApiProperty({
    description: 'ID del tipo de cita',
    example: 789,
    type: 'number'
  })
  @IsNumber()
  appointmentTypeId: number

  @ApiProperty({
    description: 'Fecha de la cita',
    example: '2024-12-25',
    format: 'date'
  })
  @IsDateString()
  date: string

  @ApiProperty({
    description: 'Hora de la cita',
    example: '10:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  })
  @IsString()
  time: string

  @ApiProperty({
    description: 'Duración de la cita en minutos',
    example: 30,
    type: 'number'
  })
  @IsNumber()
  duration: number

  @ApiProperty({
    description: 'Tipo de cita (virtual o presencial)',
    example: 'virtual',
    enum: ['virtual', 'presencial']
  })
  @IsString()
  type: string

  @ApiProperty({
    description: 'Precio de la cita',
    example: 50.00,
    type: 'number'
  })
  @IsNumber()
  price: number

  @ApiProperty({
    description: 'Notas adicionales de la cita',
    example: 'Primera consulta, traer análisis recientes',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiProperty({
    description: 'Indica si es una cita de urgencia',
    example: false,
    type: 'boolean',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean

  @ApiProperty({
    description: 'Información médica relevante',
    example: 'Alergias: Penicilina',
    required: false
  })
  @IsOptional()
  @IsString()
  medicalInfo?: string
}

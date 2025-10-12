import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsEmail, IsOptional, IsDateString, IsNumber } from 'class-validator'

export class CreatePatientDto {
  @ApiProperty({
    description: 'Nombre del paciente',
    example: 'Juan Pérez',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'Apellido del paciente',
    example: 'García',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  lastName: string

  @ApiProperty({
    description: 'Email del paciente',
    example: 'juan.perez@email.com',
    format: 'email'
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'Número de teléfono del paciente',
    example: '+34612345678',
    minLength: 9,
    maxLength: 15
  })
  @IsString()
  phone: string

  @ApiProperty({
    description: 'DNI/NIE del paciente',
    example: '12345678A',
    minLength: 9,
    maxLength: 9
  })
  @IsString()
  dni: string

  @ApiProperty({
    description: 'Fecha de nacimiento del paciente',
    example: '1990-01-15',
    format: 'date'
  })
  @IsDateString()
  birthDate: string

  @ApiProperty({
    description: 'Género del paciente',
    example: 'M',
    enum: ['M', 'F', 'O']
  })
  @IsString()
  gender: string

  @ApiProperty({
    description: 'Dirección del paciente',
    example: 'Calle Mayor 123, Madrid',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string

  @ApiProperty({
    description: 'Código postal',
    example: '28001',
    required: false
  })
  @IsOptional()
  @IsString()
  postalCode?: string

  @ApiProperty({
    description: 'Ciudad del paciente',
    example: 'Madrid',
    required: false
  })
  @IsOptional()
  @IsString()
  city?: string

  @ApiProperty({
    description: 'País del paciente',
    example: 'España',
    required: false
  })
  @IsOptional()
  @IsString()
  country?: string

  @ApiProperty({
    description: 'Información médica adicional',
    example: 'Alergias: Penicilina',
    required: false
  })
  @IsOptional()
  @IsString()
  medicalInfo?: string
}

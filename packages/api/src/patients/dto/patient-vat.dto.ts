import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatientVatDto {
  @ApiProperty({
    description: 'NIF/DNI del paciente',
    example: '12345678A'
  })
  @IsString()
  @IsNotEmpty()
  nif: string;

  @ApiProperty({
    description: 'Nombre del paciente',
    example: 'Juan'
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Primer apellido del paciente',
    example: 'Pérez'
  })
  @IsString()
  @IsNotEmpty()
  apellido1: string;

  @ApiProperty({
    description: 'Segundo apellido del paciente (opcional)',
    example: 'García',
    required: false
  })
  @IsString()
  @IsOptional()
  apellido2?: string;

  @ApiProperty({
    description: 'Teléfono del paciente',
    example: '612345678'
  })
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @ApiProperty({
    description: 'Email del paciente',
    example: 'juan.perez@email.com'
  })
  @IsString()
  @IsNotEmpty()
  email: string;
}
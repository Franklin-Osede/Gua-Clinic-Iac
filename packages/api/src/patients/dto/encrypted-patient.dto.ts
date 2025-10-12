import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class EncryptedPatientDto {
  @ApiProperty({
    description: 'Datos del paciente encriptados',
    example: 'encrypted_patient_data_string_here',
    minLength: 10
  })
  @IsString()
  @IsNotEmpty()
  encrypted_patient: string
}

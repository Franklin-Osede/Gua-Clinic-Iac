import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class PatientVatDto {
  @ApiProperty({
    description: 'VAT encriptado del paciente',
    example: 'encrypted_vat_string_here',
    minLength: 10
  })
  @IsString()
  @IsNotEmpty()
  encrypted_vat: string
}

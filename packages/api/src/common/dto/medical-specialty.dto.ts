import { ApiProperty } from '@nestjs/swagger'

export class MedicalSpecialtyDto {
  @ApiProperty({ 
    description: 'ID único de la especialidad médica',
    example: 1 
  })
  id: number

  @ApiProperty({ 
    description: 'Nombre de la especialidad médica',
    example: 'Urología' 
  })
  name: string

  @ApiProperty({ 
    description: 'Descripción de la especialidad médica',
    example: 'Especialidad urológica' 
  })
  description: string
}


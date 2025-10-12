import { Injectable } from '@nestjs/common'

@Injectable()
export class MedicalSpecialtiesService {
  async getMedicalSpecialties() {
    // TODO: Integrar con DriCloud API
    return [
      { id: 1, name: 'Urología', description: 'Especialidad urológica' },
      { id: 2, name: 'Andrología', description: 'Especialidad andrológica' }
    ]
  }
}

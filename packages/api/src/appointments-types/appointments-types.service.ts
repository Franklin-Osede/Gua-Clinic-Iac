import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class AppointmentsTypesService {
  async getAppointmentTypes(serviceId: number, type?: string) {
    try {
      // TODO: Implementar integración con DriCloud
      // Por ahora retornamos datos mock basados en el serviceId
      const mockAppointmentTypes = [
        {
          id: 1,
          name: 'Primera consulta',
          description: 'Primera consulta médica',
          price: 50.00,
          duration: 30,
          type: 'first_consultation',
          serviceId: serviceId
        },
        {
          id: 2,
          name: 'Revisión',
          description: 'Consulta de revisión',
          price: 30.00,
          duration: 15,
          type: 'revision',
          serviceId: serviceId
        },
        {
          id: 3,
          name: 'Seguimiento',
          description: 'Consulta de seguimiento',
          price: 25.00,
          duration: 10,
          type: 'follow_up',
          serviceId: serviceId
        }
      ]

      // Filtrar por tipo si se especifica
      if (type) {
        return mockAppointmentTypes.filter(apt => apt.type === type)
      }

      return mockAppointmentTypes
    } catch (error) {
      throw new NotFoundException('Tipos de citas no encontrados para este servicio')
    }
  }
}

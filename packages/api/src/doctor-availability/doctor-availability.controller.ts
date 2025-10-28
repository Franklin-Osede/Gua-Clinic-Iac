import { Controller, Get, Param, Query } from '@nestjs/common'
import { DoctorAvailabilityService } from './doctor-availability.service'

@Controller('doctor-availability')
export class DoctorAvailabilityController {
  constructor(private readonly doctorAvailabilityService: DoctorAvailabilityService) {
    console.log('🏗️ DoctorAvailabilityController constructor called')
  }

  @Get(':doctorId/:startDate')
  async getDoctorAgenda(
    @Param('doctorId') doctorId: number,
    @Param('startDate') startDate: string,
    @Query('dates_to_fetch') datesToFetch: number = 31
  ) {
    console.log(`🎯 DoctorAvailabilityController.getDoctorAgenda called:`, { doctorId, startDate, datesToFetch })
    
    // Llamar al servicio real con protección automática
    return this.doctorAvailabilityService.getDoctorAgenda(doctorId, startDate, datesToFetch)
  }

  private generateMockSlots(doctorId: number, startDate: string, datesToFetch: number) {
    const start = new Date(startDate)
    const availability = []
    
    console.log(`🎯 Generating mock slots for doctor ${doctorId} from ${startDate}`)
    
    // Generar fechas disponibles para los próximos días
    for (let i = 0; i < datesToFetch; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)
      
      // Solo generar disponibilidad para días laborables (lunes a viernes)
      if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
        // Generar horarios de 9:00 a 17:00 con intervalos de 30 minutos
        const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                          '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
                          '15:00', '15:30', '16:00', '16:30', '17:00']
        
        // Seleccionar aleatoriamente 3-5 horarios por día
        const numSlots = Math.floor(Math.random() * 3) + 3
        const selectedSlots = timeSlots.sort(() => 0.5 - Math.random()).slice(0, numSlots)
        
        selectedSlots.forEach(time => {
          const year = currentDate.getFullYear()
          const month = String(currentDate.getMonth() + 1).padStart(2, '0')
          const day = String(currentDate.getDate()).padStart(2, '0')
          const hour = time.split(':')[0]
          const minute = time.split(':')[1]
          
          // Formato: yyyyMMddHHmm:30:1:1 (30 min duración, despacho 1, doctor 1)
          const slot = `${year}${month}${day}${hour}${minute}:30:1:${doctorId}`
          availability.push(slot)
        })
      }
    }
    
    console.log(`✅ Generated ${availability.length} mock slots`)
    return availability
  }
}


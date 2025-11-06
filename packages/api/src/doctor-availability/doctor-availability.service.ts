import { Injectable } from '@nestjs/common'
import { DriCloudService } from '../dricloud/dricloud.service'

@Injectable()
export class DoctorAvailabilityService {
  constructor(private driCloudService: DriCloudService) {}

  async getDoctorAgenda(doctorId: number, startDate: string, datesToFetch: number) {
    console.log(`🔍 DoctorAvailabilityService.getDoctorAgenda called with:`, { doctorId, startDate, datesToFetch })
    
    if (!doctorId || doctorId <= 0) {
      throw new Error(`Invalid doctorId: ${doctorId}. Must be a positive number.`);
    }
    
    if (!startDate || startDate.length < 8) {
      throw new Error(`Invalid startDate: ${startDate}. Expected format: yyyyMMdd or YYYY-MM-DD.`);
    }
    
    // Según documentación DriCloud API v2.3: diasRecuperar acepta valores entre 1 y 31
    // Para obtener más de 31 días, se deben hacer múltiples llamadas
    if (datesToFetch <= 0 || datesToFetch > 31) {
      throw new Error(`Invalid datesToFetch: ${datesToFetch}. Must be between 1 and 31 (DriCloud API limit). For 2 months, make multiple calls.`);
    }
    
    try {
      // Llamar directamente a DriCloud con protección automática
      const result = await this.driCloudService.getDoctorAgenda(doctorId, startDate, datesToFetch);
      
      // Validar que la respuesta tenga el formato correcto
      if (!result) {
        console.warn(`⚠️ DoctorAvailabilityService: respuesta vacía de DriCloud para doctor ${doctorId}`);
        return { Successful: false, Data: { Disponibilidad: [] } };
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error en DoctorAvailabilityService.getDoctorAgenda:`, error);
      // Si es un error de DriCloud, devolver estructura válida
      if (error.message && error.message.includes('DriCloud')) {
        return { Successful: false, Data: { Disponibilidad: [] }, Html: error.message };
      }
      throw error;
    }
  }

  private generateMockAvailability(doctorId: number, startDate: string, datesToFetch: number) {
    const start = new Date(startDate)
    const availability = []
    
    console.log(`🎯 Generating mock availability for doctor ${doctorId} from ${startDate} for ${datesToFetch} days`)
    
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


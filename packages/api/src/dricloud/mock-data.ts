// Datos mock para desarrollo sin Docker
export const MOCK_DATA = {
  login: {
    Successful: true,
    Data: {
      USU_APITOKEN: 'mock-token-12345'
    }
  },
  
  specialties: {
    Successful: true,
    Data: [
      {
        ESP_ID: 1,
        ESP_NOMBRE: 'Urología',
        ESP_DESCRIPCION: 'Especialidad en urología'
      },
      {
        ESP_ID: 2,
        ESP_NOMBRE: 'Andrología',
        ESP_DESCRIPCION: 'Especialidad en andrología'
      }
    ]
  },
  
  doctors: {
    Successful: true,
    Data: [
      {
        USU_ID: 1,
        USU_NOMBRE: 'Dr. García',
        USU_APELLIDOS: 'López',
        ESP_ID: 1
      },
      {
        USU_ID: 2,
        USU_NOMBRE: 'Dr. Martínez',
        USU_APELLIDOS: 'Ruiz',
        ESP_ID: 2
      }
    ]
  },
  
  appointmentTypes: {
    Successful: true,
    Data: [
      {
        TIP_ID: 1,
        TIP_NOMBRE: 'Primera consulta',
        TIP_DURACION: 30,
        TIP_PRECIO: 50.00
      },
      {
        TIP_ID: 2,
        TIP_NOMBRE: 'Revisión',
        TIP_DURACION: 20,
        TIP_PRECIO: 30.00
      }
    ]
  },
  
  availability: {
    Successful: true,
    Data: [
      {
        FECHA: '2025-10-29',
        HORAS: ['09:00', '10:00', '11:00', '16:00', '17:00']
      },
      {
        FECHA: '2025-10-30',
        HORAS: ['09:00', '10:00', '11:00', '16:00', '17:00']
      }
    ]
  },
  
  createPatient: {
    Successful: true,
    Data: {
      PAC_ID: 999
    }
  },
  
  createAppointment: {
    Successful: true,
    Data: {
      CITA_ID: 12345
    }
  }
};

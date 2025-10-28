// Tipos compartidos entre widget y API

export interface FormFields {
  name: string
  birthdate: string
  phone: string
  email: string
  vat: string
}

export interface CreatePatient {
  PAC_NOMBRE: string
  PAC_APELLIDOS: string
  PAC_FECHA_NACIMIENTO: string
  PAC_TELEFONO1: string
  PAC_EMAIL: string
  PAC_NIF: string
}

export interface CreateAppointment {
  USU_ID: number
  fechaInicioCitaString: string
  PAC_ID: number
  observaciones: string
}

export interface AppointmentOption {
  name: string
  description: string
  logoType: string
  extra: {
    id: number
    price: number
    duration: number
  }
}

export interface AppointmentInfo {
  id: number
  duration: number
  price: number
}

// Widget props
export interface GuaWidgetProps {
  locale?: string
  theme?: string
  baseUrl?: string
}

// API responses
export interface BootstrapResponse {
  locale: string
  theme: string
  features: {
    virtualAppointments: boolean
    physicalAppointments: boolean
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}










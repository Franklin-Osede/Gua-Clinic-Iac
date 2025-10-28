import { FormFields, CreatePatient, CreateAppointment } from '../types'

// Utilidades compartidas entre widget y API

export const formatStringFromDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

export const formatDateToLocaleString = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export const convertTo24HourFormat = (timeString: string): string => {
  const [time, period] = timeString.split(' ')
  const [hours, minutes] = time.split('.').map(Number)

  let hours24 = hours
  if (period.toLowerCase() === 'pm' && hours !== 12) {
    hours24 += 12
  } else if (period.toLowerCase() === 'am' && hours === 12) {
    hours24 = 0
  }

  return `${String(hours24).padStart(2, '0')}${String(minutes).padStart(2, '0')}`
}

export const formatPatientData = (data: FormFields): CreatePatient => {
  const [firstName, ...lastNameParts] = data.name.trim().split(' ')
  const lastName = lastNameParts.join(' ')

  return {
    PAC_NOMBRE: firstName,
    PAC_APELLIDOS: lastName,
    PAC_FECHA_NACIMIENTO: data.birthdate,
    PAC_TELEFONO1: data.phone,
    PAC_EMAIL: data.email,
    PAC_NIF: data.vat,
  }
}

export const formatAppointmentData = (
  doctorId: number,
  date: string,
  patientId: number,
  observations: string,
): CreateAppointment => {
  return {
    USU_ID: doctorId,
    fechaInicioCitaString: date,
    PAC_ID: patientId,
    observaciones: observations,
  }
}

// Utilidades de validación
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const isValidVAT = (vat: string): boolean => {
  const vatRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/
  return vatRegex.test(vat.toUpperCase())
}










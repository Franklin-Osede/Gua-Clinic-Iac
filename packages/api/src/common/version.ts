export const API_VERSION = '1.0.0'
export const API_NAME = 'GUA Clinic API'
export const API_DESCRIPTION = 'API para el sistema de citas médicas GUA Clinic'

export const VERSION_INFO = {
  version: API_VERSION,
  name: API_NAME,
  description: API_DESCRIPTION,
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
}


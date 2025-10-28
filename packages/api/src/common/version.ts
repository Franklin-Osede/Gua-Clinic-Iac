export const VERSION_INFO = {
  version: '1.0.0',
  name: 'GUA Clinic API',
  description: 'API para el sistema de citas médicas GUA Clinic',
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
};

// Exportaciones individuales para main.ts
export const API_VERSION = VERSION_INFO.version;
export const API_NAME = VERSION_INFO.name;
export const API_DESCRIPTION = VERSION_INFO.description;
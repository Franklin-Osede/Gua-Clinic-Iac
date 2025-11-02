/**
 * Configuración global de la API
 * Permite establecer la URL de la API dinámicamente desde el atributo base-url del Web Component
 */

let apiBaseUrl: string | null = null;

/**
 * Establece la URL base de la API
 * Debe llamarse cuando el widget se inicializa con el atributo base-url
 */
export function setApiBaseUrl(url: string): void {
  // Normalizar la URL (eliminar trailing slash)
  apiBaseUrl = url.replace(/\/$/, '');
  console.log('🔧 API Base URL configurada:', apiBaseUrl);
}

/**
 * Obtiene la URL base de la API
 * Usa la configuración dinámica si está disponible, sino usa la variable de entorno
 */
export function getApiBaseUrl(): string {
  if (apiBaseUrl) {
    return apiBaseUrl;
  }
  
  // Fallback a variable de entorno (útil para desarrollo)
  const envUrl = import.meta.env.VITE_GUA_SERVICE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback por defecto (solo para desarrollo)
  console.warn('⚠️ No se configuró baseUrl ni VITE_GUA_SERVICE_URL, usando fallback');
  return 'http://localhost:3000';
}



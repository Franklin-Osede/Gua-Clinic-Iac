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
  
  // Fallback por defecto (SIEMPRE HTTPS en producción)
  // En desarrollo, si no hay .env.development, usar el API Gateway HTTPS
  // Nunca usar localhost:3000 o IPs HTTP porque causan "Mixed Content" en WordPress
  console.warn('⚠️ No se configuró baseUrl ni VITE_GUA_SERVICE_URL, usando fallback HTTPS');
  return 'https://ybymfv93yg.execute-api.eu-north-1.amazonaws.com/prod';
}

/**
 * Configuración del CDN para imágenes estáticas (doctores, logos, etc.)
 */

let cdnBaseUrl: string | null = null;

/**
 * Establece la URL base del CDN
 * Debe llamarse cuando el widget se inicializa con el atributo cdn-url
 */
export function setCdnBaseUrl(url: string): void {
  // Normalizar la URL (eliminar trailing slash)
  cdnBaseUrl = url.replace(/\/$/, '');
  console.log('🔧 CDN Base URL configurada:', cdnBaseUrl);
}

/**
 * Obtiene la URL base del CDN
 * En desarrollo, usa rutas relativas. En producción, usa el CDN configurado.
 */
export function getCdnBaseUrl(): string {
  // Si está configurado dinámicamente, usarlo
  if (cdnBaseUrl) {
    return cdnBaseUrl;
  }
  
  // En desarrollo (localhost), usar rutas relativas
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }
  
  // En producción, usar variable de entorno o fallback
  const envCdnUrl = import.meta.env.VITE_CDN_BASE_URL;
  if (envCdnUrl) {
    return envCdnUrl.replace(/\/$/, '');
  }
  
  // Fallback: usar S3 bucket directamente (si está configurado)
  // URL del bucket S3: https://cdn-gua-com.s3.eu-north-1.amazonaws.com
  // En producción, usar esta URL o configurar CloudFront para mejor rendimiento
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // En producción (WordPress), usar S3 directamente
    return 'https://cdn-gua-com.s3.eu-north-1.amazonaws.com';
  }
  
  // En desarrollo, usar rutas relativas
  return '';
}











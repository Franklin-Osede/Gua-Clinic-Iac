import axios from "axios";
import { CreateAppointment, CreatePatient } from "@gua/shared";
import { decryptData, encryptData } from "./AESencryption.ts";
import { sessionManager } from "./session.service.ts";
import { getApiBaseUrl } from "../config/api.config.ts";

// ✅ TOKEN HARDCODEADO ELIMINADO - Ahora se obtiene del endpoint /bootstrap
// La URL base se configura dinámicamente desde el atributo base-url del Web Component
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // Para enviar cookies de sesión
  timeout: 30000, // 30 segundos de timeout para evitar peticiones colgadas
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para actualizar la URL base dinámicamente y validar sesión antes de cada request
apiClient.interceptors.request.use(
  async (config) => {
    // Actualizar la URL base en cada request (por si cambió dinámicamente)
    config.baseURL = getApiBaseUrl();
    console.log(`🔧 Interceptor request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      withCredentials: config.withCredentials
    });
    
    // Asegurar que tenemos una sesión válida antes de hacer el request
    try {
      await sessionManager.ensureValidSession();
    } catch (error) {
      console.error('⚠️ No se pudo renovar sesión, continuando con request...', error);
      // Continuar con el request de todas formas (el backend manejará la sesión)
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de sesión
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Interceptor response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    console.log(`✅ Response data type:`, typeof response.data, Array.isArray(response.data) ? 'array' : 'object');
    console.log(`✅ Response data length:`, Array.isArray(response.data) ? response.data.length : 'N/A');
    return response;
  },
  async (error) => {
    console.error(`❌ Interceptor response error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      message: error.message,
      hasResponse: !!error.response
    });
    
    // Si recibimos un 401, intentar renovar sesión y reintentar
    if (error.response?.status === 401) {
      try {
        console.log('🔄 Sesión expirada (401), renovando...');
        await sessionManager.initializeSession();
        
        // Reintentar el request original
        return apiClient.request(error.config);
      } catch (renewError) {
        console.error('❌ Error al renovar sesión:', renewError);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Inicializa la sesión al cargar el widget
 */
export const initializeSession = async () => {
  try {
    const session = await sessionManager.initializeSession();
    console.log('✅ Sesión inicializada:', session.id);
    return session;
  } catch (error) {
    console.error('❌ Error al inicializar sesión:', error);
    throw error;
  }
};

// Datos estáticos de fallback (las 6 especialidades principales)
const FALLBACK_SPECIALTIES = [
  { id: 1, name: 'Urología', ESP_ID: 1, ESP_NOMBRE: 'Urología' },
  { id: 18, name: 'Andrología y medicina sexual', ESP_ID: 18, ESP_NOMBRE: 'Andrología y medicina sexual' },
  { id: 10, name: 'Fisioterapia', ESP_ID: 10, ESP_NOMBRE: 'Fisioterapia' },
  { id: 9, name: 'Ginecología', ESP_ID: 9, ESP_NOMBRE: 'Ginecología' },
  { id: 6, name: 'Medicina Rehabilitadora', ESP_ID: 6, ESP_NOMBRE: 'Medicina Rehabilitadora' },
  { id: 19, name: 'Medicina Integrativa', ESP_ID: 19, ESP_NOMBRE: 'Medicina Integrativa' },
];

export const getMedicalSpecialties = async (refresh: boolean = false) => {
  const url = refresh ? `/medical-specialties?refresh=true` : `/medical-specialties`;
  const fullUrl = `${getApiBaseUrl()}${url}`;
  
  // ESTRATEGIA SIMPLE: Retry con 3 intentos (sin over-engineering)
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 Intento ${attempt}/${maxRetries}: Llamando a ${fullUrl}`);
      const startTime = Date.now();
      
      // Timeout más corto en cada intento (20s, 25s, 30s)
      const timeout = attempt * 10000 + 10000; // 20s, 30s, 40s
      
      const response = await apiClient.get(url, {
        timeout: timeout,
      });
    
      const duration = Date.now() - startTime;
      console.log(`✅ Respuesta recibida en ${duration}ms (intento ${attempt})`);
      
      // Si la respuesta tiene un mensaje de error, loguearlo
      if (response.data?.message) {
        console.error(`❌ API devolvió mensaje de error:`, response.data.message);
        if (response.status === 503 || response.data.message.includes('Unavailable')) {
          // Si es 503, intentar de nuevo (puede ser que el caché se esté cargando)
          if (attempt < maxRetries) {
            console.log(`⏳ Esperando 2 segundos antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
      }
      
      // El backend ahora devuelve directamente un array de especialidades
      let specialties: any[] = [];
      if (Array.isArray(response.data)) {
        specialties = response.data;
      } else if (response.data.Data?.Especialidades) {
        specialties = response.data.Data.Especialidades;
      } else if (response.data.Especialidades) {
        specialties = response.data.Especialidades;
      }
      
      if (specialties.length > 0) {
        console.log(`✅ Éxito: ${specialties.length} especialidades obtenidas`);
        return specialties;
      }
      
      // Si llegamos aquí, la respuesta está vacía, intentar de nuevo
      if (attempt < maxRetries) {
        console.log(`⚠️ Respuesta vacía, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Intento ${attempt}/${maxRetries} falló:`, error.message);
      
      // Si es timeout o error de red, esperar antes de reintentar
      if (attempt < maxRetries && (error.code === 'ECONNABORTED' || !error.response)) {
        const delay = attempt * 2000; // 2s, 4s
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Si es el último intento, no continuar
      if (attempt === maxRetries) {
        break;
      }
    }
  }
  
  // Si todos los intentos fallaron, usar datos estáticos de fallback
  console.warn('⚠️ Todos los intentos fallaron, usando datos estáticos de fallback');
  console.warn('⚠️ Esto significa que el backend no está disponible o el caché no está listo');
  if (lastError) {
    console.error("❌ Error final después de todos los intentos:", lastError.message);
  }
  return FALLBACK_SPECIALTIES;
};

export const getAppointmentTypes = async (serviceId: number, type?: string) => {
  try {
    const url = type
      ? `/appointments-types/${serviceId}?_type=${type}`
      : `/appointments-types/${serviceId}`;

    const response = await apiClient.get(url);
    // DriCloud devuelve { Successful: true, Data: [...] }
    // Necesitamos extraer el array de tipos de cita
    return response.data.Data || [];
  } catch (error) {
    console.error("Error fetching appointment types data:", error);
    throw error;
  }
};

export const getDoctors = async (serviceId: number) => {
  if (serviceId === 0) {
    throw new Error("Invalid id: specialty_id cannot be 0.");
  }

  try {
    const url = `/doctors/${serviceId}`;
    const fullUrl = `${getApiBaseUrl()}${url}`;
    console.log(`🌐 Llamando a: ${fullUrl}`);
    console.log(`⏳ Iniciando petición GET a /doctors/${serviceId}...`);
    const startTime = Date.now();
    
    // Aumentar timeout específicamente para doctores (60 segundos) porque puede tardar más en producción
    const response = await apiClient.get(url, {
      timeout: 60000, // 60 segundos para doctores
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Respuesta recibida en ${duration}ms`);
    console.log(`✅ Status:`, response.status);
    console.log(`✅ Headers:`, response.headers);
    console.log('📥 Respuesta completa de la API /doctors:', response.data);
    console.log('📥 Tipo de respuesta:', typeof response.data);
    console.log('📥 ¿Es array?:', Array.isArray(response.data));
    
    // Validar que la respuesta no sea un error
    // Si la respuesta tiene un campo "message" y no es un array, probablemente es un error
    if (response.data?.message && !Array.isArray(response.data)) {
      console.error("❌ Error response from API:", response.data);
      throw new Error(response.data.message || "Service Unavailable");
    }
    
    // El backend debería devolver directamente un array [{ doctor_id, name, surname, ... }]
    // Pero también manejamos el caso donde viene la estructura completa de DriCloud
    let doctors: any[] = [];
    
    if (Array.isArray(response.data)) {
      // Caso ideal: el backend ya transformó y devolvió un array
      doctors = response.data;
      console.log('✅ Respuesta es array directo con', doctors.length, 'doctores');
    } else if (response.data?.Data) {
      // Caso: estructura DriCloud { Successful: true, Data: { Doctores: [...] } }
      if (Array.isArray(response.data.Data)) {
        doctors = response.data.Data;
        console.log('✅ Respuesta tiene Data como array con', doctors.length, 'doctores');
      } else if (response.data.Data.Doctores && Array.isArray(response.data.Data.Doctores)) {
        doctors = response.data.Data.Doctores;
        console.log('✅ Respuesta tiene Data.Doctores con', doctors.length, 'doctores');
      } else if (response.data.Data.Doctores && !Array.isArray(response.data.Data.Doctores)) {
        // Si Doctores no es un array, podría ser un objeto único
        doctors = [response.data.Data.Doctores];
        console.log('⚠️ Doctores es un objeto único, convertido a array');
      }
    } else if (response.data?.Doctores) {
      // Caso: estructura directa { Doctores: [...] }
      if (Array.isArray(response.data.Doctores)) {
        doctors = response.data.Doctores;
        console.log('✅ Respuesta tiene Doctores directo con', doctors.length, 'doctores');
      } else {
        doctors = [response.data.Doctores];
        console.log('⚠️ Doctores es un objeto único, convertido a array');
      }
    }
    
    // Validar que sea un array antes de devolver
    if (!Array.isArray(doctors)) {
      console.error("❌ Invalid response format, expected array:", response.data);
      console.error("❌ Doctors extracted:", doctors);
      throw new Error("Invalid response format from API");
    }
    
    console.log('✅ Doctores finales a devolver:', doctors.length, 'doctores');
    console.log('📋 Primer doctor (muestra):', doctors[0]);
    
    return doctors;
  } catch (error: any) {
    console.error("❌ ========== ERROR CAPTURADO EN getDoctors ==========");
    console.error("❌ Error fetching doctors data:", error);
    console.error("❌ Error type:", error.constructor.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      serviceId: serviceId
    });
    
    // Si es un error de red (sin response), mostrar más detalles
    if (!error.response) {
      console.error("❌ ========== ERROR DE RED ==========");
      console.error("❌ No hay respuesta del servidor (posible CORS, timeout, o red)");
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
    } else {
      console.error("❌ ========== ERROR DEL SERVIDOR ==========");
      console.error("❌ Status:", error.response.status);
      console.error("❌ Status Text:", error.response.statusText);
      console.error("❌ Response Data:", error.response.data);
    }
    console.error("❌ ========================================");
    throw error;
  }
};

export const getDoctorAgenda = async (
  doctorId: number,
  startDate: string,
  datesToFetch: number = 31,
) => {
  try {
    const response = await apiClient.get(
      `/doctor-availability/${doctorId}/${startDate}?dates_to_fetch=${datesToFetch}`,
    );
    
    // DriCloud devuelve { Successful: true, Data: { Disponibilidad: [...] } }
    // Extraer el array de Disponibilidad
    if (response.data?.Data?.Disponibilidad) {
      return response.data.Data.Disponibilidad;
    }
    
    // Si ya es un array directo (formato antiguo o mock)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Si viene como objeto con Disponibilidad en el root
    if (response.data?.Disponibilidad && Array.isArray(response.data.Disponibilidad)) {
      return response.data.Disponibilidad;
    }
    
    // Fallback: devolver array vacío si no hay formato reconocido
    console.warn('⚠️ Formato de respuesta no reconocido:', response.data);
    return [];
  } catch (error) {
    console.error("Error fetching doctors data:", error);
    throw error;
  }
};

export const getPatientByEncryptedWAT = async (patientVAT: string) => {
  try {
    const encryptedVAT = encryptData(patientVAT);
    const response = await apiClient.post(`/patient/vat`, {
      encrypted_vat: encryptedVAT,
    });
    return decryptData(response.data);
  } catch (error) {
    console.error("Error fetching patient:", error);
    throw error;
  }
};

export const createPatient = async (data: CreatePatient) => {
  try {
    const encryptedPatientData = encryptData(JSON.stringify(data));
    const response = await apiClient.post(`/encrypted-patient`, {
      encrypted_patient: encryptedPatientData,
    });
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};

export const createAppointment = async (data: CreateAppointment) => {
  try {
    // Generar requestId único para idempotencia
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const response = await apiClient.post(`/appointment`, data, {
      headers: {
        'X-Request-ID': requestId, // Header para idempotencia
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};

/**
 * Obtiene el estado de una cita usando el trackingId
 */
export const getAppointmentStatus = async (trackingId: string) => {
  try {
    const response = await apiClient.get(`/appointment/${trackingId}/status`);
    return response.data;
  } catch (error) {
    console.error("Error fetching appointment status:", error);
    throw error;
  }
};

/**
 * Hace polling del estado de una cita hasta que esté confirmada o falle
 * @param trackingId ID de tracking de la cita
 * @param onStatusChange Callback que se ejecuta cuando cambia el estado
 * @param maxAttempts Número máximo de intentos (default: 15 = 30 segundos)
 * @param intervalMs Intervalo entre intentos en ms (default: 2000 = 2 segundos)
 */
export const pollAppointmentStatus = async (
  trackingId: string,
  onStatusChange?: (status: string) => void,
  maxAttempts: number = 15,
  intervalMs: number = 2000
): Promise<{ status: string; confirmed: boolean; errorMessage?: string }> => {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++;
        const statusData = await getAppointmentStatus(trackingId);
        
        // Notificar cambio de estado
        if (onStatusChange) {
          onStatusChange(statusData.status);
        }

        // Si está confirmada o falló, terminar
        if (statusData.status === 'confirmed') {
          resolve({ status: statusData.status, confirmed: true });
          return;
        }

        if (statusData.status === 'failed') {
          resolve({ 
            status: statusData.status, 
            confirmed: false,
            errorMessage: statusData.errorMessage 
          });
          return;
        }

        // Si aún está procesando y no hemos alcanzado el máximo de intentos
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        } else {
          // Timeout: asumir que está procesando pero no se confirmó aún
          resolve({ 
            status: 'processing', 
            confirmed: false,
            errorMessage: 'Timeout esperando confirmación' 
          });
        }
      } catch (error) {
        // Si hay error y aún tenemos intentos, seguir intentando
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        } else {
          reject(error);
        }
      }
    };

    poll();
  });
};

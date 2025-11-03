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
});

// Interceptor para actualizar la URL base dinámicamente y validar sesión antes de cada request
apiClient.interceptors.request.use(
  async (config) => {
    // Actualizar la URL base en cada request (por si cambió dinámicamente)
    config.baseURL = getApiBaseUrl();
    
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
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de sesión
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
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

export const getMedicalSpecialties = async () => {
  try {
    const response = await apiClient.get(`/medical-specialties`);
    // El backend ahora devuelve directamente un array de especialidades
    // Manejar tanto array directo como estructura antigua
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.Data?.Especialidades) {
      return response.data.Data.Especialidades;
    } else if (response.data.Especialidades) {
      return response.data.Especialidades;
    }
    return [];
  } catch (error) {
    console.error("Error fetching medical specialties data:", error);
    throw error;
  }
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
    const response = await apiClient.get(`/doctors/${serviceId}`);
    // El backend ahora devuelve directamente un array [{ doctor_id, name, surname, ... }]
    // Mantenemos compatibilidad con el formato antiguo por si acaso
    return Array.isArray(response.data) 
      ? response.data 
      : (response.data.Data || response.data.Doctores || []);
  } catch (error) {
    console.error("Error fetching doctors data:", error);
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
    return response.data;
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

import axios from "axios";
import { getApiBaseUrl } from "../config/api.config.ts";

export interface SessionData {
  id: string;
  expiresAt: string;
  createdAt: string;
  locale: string;
  theme: string;
}

class SessionManager {
  private sessionData: SessionData | null = null;
  private isInitializing = false;
  private initPromise: Promise<SessionData> | null = null;

  /**
   * Inicializa la sesión llamando al endpoint /bootstrap
   */
  async initializeSession(): Promise<SessionData> {
    // Si ya hay una inicialización en curso, esperar a que termine
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    // Si la sesión es válida, retornarla
    if (this.sessionData && this.isSessionValid()) {
      return this.sessionData;
    }

    // Inicializar nueva sesión
    this.isInitializing = true;
    this.initPromise = this.fetchBootstrap();

    try {
      const session = await this.initPromise;
      this.sessionData = session;
      return session;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  /**
   * Obtiene la sesión actual (sin validar)
   */
  getSession(): SessionData | null {
    return this.sessionData;
  }

  /**
   * Verifica si la sesión es válida (no expirada)
   */
  isSessionValid(): boolean {
    if (!this.sessionData) {
      return false;
    }

    const expiresAt = new Date(this.sessionData.expiresAt);
    const now = new Date();
    
    // Renovar si faltan menos de 5 minutos
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    return timeUntilExpiry > fiveMinutes;
  }

  /**
   * Renueva la sesión si está cerca de expirar
   */
  async ensureValidSession(): Promise<SessionData> {
    if (!this.isSessionValid()) {
      console.log('🔄 Sesión expirada o próxima a expirar, renovando...');
      return this.initializeSession();
    }

    return this.sessionData!;
  }

  /**
   * Llama al endpoint /bootstrap para obtener/renovar sesión
   */
  private async fetchBootstrap(): Promise<SessionData> {
    try {
      const apiUrl = getApiBaseUrl();
      console.log('🌐 Llamando a:', `${apiUrl}/bootstrap`);
      
      const response = await axios.get(`${apiUrl}/bootstrap`, {
        withCredentials: true, // Importante para enviar cookies
      });

      console.log('✅ Respuesta bootstrap:', response.status, response.data);
      
      if (!response.data?.session) {
        throw new Error('La respuesta no contiene session');
      }

      return response.data.session;
    } catch (error: any) {
      console.error('❌ Error detallado al inicializar sesión:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw new Error(`No se pudo inicializar la sesión: ${error.response?.status || error.message}`);
    }
  }

  /**
   * Limpia la sesión actual
   */
  clearSession(): void {
    this.sessionData = null;
  }
}

// Singleton instance
export const sessionManager = new SessionManager();


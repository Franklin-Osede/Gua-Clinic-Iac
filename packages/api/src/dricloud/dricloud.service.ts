import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class DriCloudService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private isRefreshing = false;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  async getValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      await this.refreshToken();
    }
    return this.token!;
  }

  private async refreshToken() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    try {
      const response = await this.httpService.post(
        `https://apidricloud.dricloud.net/${this.getClinicUrl()}/api/APIWeb/LoginExternalHash`,
        this.getLoginParams()
      ).toPromise();

      if (response.data.Successful) {
        this.token = response.data.Data.USU_APITOKEN;
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        console.log('✅ DriCloud token refreshed successfully');
      } else {
        throw new Error('Failed to refresh DriCloud token');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private getLoginParams() {
    // Obtener fecha actual en España peninsular - método más directo
    const now = new Date();
    const spainTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Madrid"}));
    
    // Formato yyyyMMddHHmmss - método más simple y directo
    const year = spainTime.getFullYear();
    const month = String(spainTime.getMonth() + 1).padStart(2, '0');
    const day = String(spainTime.getDate()).padStart(2, '0');
    const hour = String(spainTime.getHours()).padStart(2, '0');
    const minute = String(spainTime.getMinutes()).padStart(2, '0');
    const second = String(spainTime.getSeconds()).padStart(2, '0');
    
    const timeSpanString = `${year}${month}${day}${hour}${minute}${second}`;
    
    const passwordMD5 = crypto.createHash('md5').update(this.configService.get('DRICLOUD_WEBAPI2_PASSWORD')).digest('hex');
    const inputForHash = this.configService.get('DRICLOUD_WEBAPI2_USER') + passwordMD5 + timeSpanString + 'sFfDS395$YGTry546g';
    const hash = crypto.createHash('md5').update(inputForHash).digest('hex');

    console.log('🔐 DriCloud Login Params:', {
      userName: this.configService.get('DRICLOUD_WEBAPI2_USER'),
      timeSpanString,
      idClinica: this.configService.get('DRICLOUD_CLINIC_ID'),
      hashLength: hash.length,
      spainTime: spainTime.toISOString()
    });

    return {
      userName: this.configService.get('DRICLOUD_WEBAPI2_USER'),
      timeSpanString,
      hash,
      idClinica: this.configService.get('DRICLOUD_CLINIC_ID')
    };
  }

  private getClinicUrl(): string {
    return this.configService.get('DRICLOUD_CLINIC_URL');
  }

  private isTokenExpired(): boolean {
    return !this.token || !this.tokenExpiry || this.tokenExpiry <= new Date();
  }

  // Métodos para llamadas a la API
  async getMedicalSpecialties() {
    const token = await this.getValidToken();
    const response = await this.httpService.post(
      `https://apidricloud.dricloud.net/${this.getClinicUrl()}/api/APIWeb/GetEspecialidades`,
      { CLI_ID: this.configService.get('DRICLOUD_CLINIC_ID') },
      { headers: { USU_APITOKEN: token } }
    ).toPromise();
    
    return response.data;
  }

  async getDoctors(espId: number) {
    const token = await this.getValidToken();
    const response = await this.httpService.post(
      `https://apidricloud.dricloud.net/${this.getClinicUrl()}/api/APIWeb/GetDoctores`,
      { ESP_ID: espId },
      { headers: { USU_APITOKEN: token } }
    ).toPromise();
    
    return response.data;
  }

  async getDoctorAgenda(doctorId: number, startDate: string, datesToFetch: number = 31) {
    const token = await this.getValidToken();
    const response = await this.httpService.post(
      `https://apidricloud.dricloud.net/${this.getClinicUrl()}/api/APIWeb/GetAgendaDisponibilidad`,
      {
        USU_ID: doctorId,
        fecha: startDate,
        diasRecuperar: datesToFetch
      },
      { headers: { USU_APITOKEN: token } }
    ).toPromise();
    
    return response.data;
  }

  async getPatientByNIF(nif: string) {
    const token = await this.getValidToken();
    const response = await this.httpService.post(
      `https://apidricloud.dricloud.net/${this.getClinicUrl()}/api/APIWeb/GetPacienteByNIF`,
      { id: nif },
      { headers: { USU_APITOKEN: token } }
    ).toPromise();
    
    return response.data;
  }

  async createPatient(patientData: any) {
    const token = await this.getValidToken();
    const response = await this.httpService.post(
      `https://apidricloud.dricloud.net/${this.getClinicUrl()}/api/APIWeb/PostCreatePaciente`,
      { paciente: patientData },
      { headers: { USU_APITOKEN: token } }
    ).toPromise();
    
    return response.data;
  }

  async createAppointment(appointmentData: any) {
    const token = await this.getValidToken();
    const response = await this.httpService.post(
      `https://apidricloud.dricloud.net/${this.getClinicUrl()}/api/APIWeb/PostCitaPaciente`,
      appointmentData,
      { headers: { USU_APITOKEN: token } }
    ).toPromise();
    
    return response.data;
  }
}

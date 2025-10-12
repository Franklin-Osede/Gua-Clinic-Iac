import axios from "axios";
import { CreateAppointment, CreatePatient } from "@gua/shared";
import { decryptData, encryptData } from "./AESencryption.ts";

const GUA_SERVICE_URL = import.meta.env.VITE_GUA_SERVICE_URL;

const apiClient = axios.create({
  baseURL: GUA_SERVICE_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_API_BEARER_TOKEN}`,
  },
});

export const getMedicalSpecialties = async () => {
  try {
    const response = await apiClient.get(`/medical-specialties`);
    return response.data;
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
    return response.data;
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
    return response.data;
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
    const response = await apiClient.post(`/appointment`, data);
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};

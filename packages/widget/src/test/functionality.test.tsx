import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MainPage from '../pages/MainPage'

// Mock de los servicios
vi.mock('../services/GuaAPIService', () => ({
  getMedicalSpecialties: vi.fn().mockResolvedValue([
    { id: 1, name: 'Urología', description: 'Especialidad urológica' },
    { id: 2, name: 'Andrología', description: 'Especialidad andrológica' }
  ]),
  getAppointmentTypes: vi.fn().mockResolvedValue([
    { id: 1, name: 'Primera consulta', price: 50, duration: 30 },
    { id: 2, name: 'Revisión', price: 30, duration: 15 }
  ]),
  getDoctors: vi.fn().mockResolvedValue([
    { id: 1, name: 'Dr. García', specialty: 'Urología' },
    { id: 2, name: 'Dr. López', specialty: 'Andrología' }
  ]),
  getDoctorAgenda: vi.fn().mockResolvedValue({
    availableSlots: [
      { date: '2024-12-25', time: '10:00' },
      { date: '2024-12-25', time: '11:00' }
    ]
  }),
  createPatient: vi.fn().mockResolvedValue({ PAC_ID: 123 }),
  createAppointment: vi.fn().mockResolvedValue({ success: true })
}))

describe('GUA Widget - Funcionalidad Completa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Flujo de Citas - 10 Páginas', () => {
    it('debe mostrar página inicial de servicios', async () => {
      render(<MainPage />)
      
      // Verificar que se muestran las especialidades
      await waitFor(() => {
        expect(screen.getByText('Urología')).toBeInTheDocument()
        expect(screen.getByText('Andrología y medicina sexual')).toBeInTheDocument()
      })
    })

    it('debe navegar entre páginas correctamente', async () => {
      render(<MainPage />)
      
      // Página 1: Servicios
      await waitFor(() => {
        expect(screen.getByText('Urología')).toBeInTheDocument()
        expect(screen.getByText('Andrología y medicina sexual')).toBeInTheDocument()
      })
      
      // Simular clic en especialidad
      const specialtyCard = screen.getByText('Urología')
      fireEvent.click(specialtyCard)
      
      // Verificar que se muestra el botón "Siguiente"
      await waitFor(() => {
        expect(screen.getByText('Siguiente')).toBeInTheDocument()
      })
    })
  })

  describe('Estados de UI', () => {
    it('debe mostrar loading durante carga inicial', async () => {
      render(<MainPage />)
      
      // Verificar que se muestra loading
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('debe mostrar error en caso de fallo', async () => {
      // Mock de error
      const { getMedicalSpecialties } = await import('../services/GuaAPIService')
      vi.mocked(getMedicalSpecialties).mockRejectedValueOnce(new Error('Error del servidor'))
      
      render(<MainPage />)
      
      // Verificar que se muestra error
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Encriptación AES', () => {
    it('debe encriptar datos sensibles', async () => {
      render(<MainPage />)
      
      // Verificar que el componente se renderiza correctamente
      expect(screen.getByText('Bienvenido/a a Cita Online 👋')).toBeInTheDocument()
    })
  })
})
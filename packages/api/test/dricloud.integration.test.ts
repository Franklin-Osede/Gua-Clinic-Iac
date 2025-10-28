import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DriCloudService } from '../src/dricloud/dricloud.service';

describe('DriCloud Integration Tests', () => {
  let app: INestApplication;
  let mockServer: StartedTestContainer;
  let mockServerUrl: string;

  beforeAll(async () => {
    // 1. Iniciar Mock Server
    console.log('🐳 Starting Mock Server...');
    mockServer = await new GenericContainer('mockserver/mockserver:5.15.0')
      .withExposedPorts(1080)
      .withEnvironment({
        'MOCKSERVER_INITIALIZATION_JSON_PATH': '/config/expectations.json'
      })
      .withCopyFilesToContainer([
        {
          source: './test/mocks/dricloud-expectations.json',
          target: '/config/expectations.json'
        }
      ])
      .start();

    mockServerUrl = `http://${mockServer.getHost()}:${mockServer.getMappedPort(1080)}`;
    console.log(`✅ Mock Server running at: ${mockServerUrl}`);

    // 2. Configurar módulo de testing
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(DriCloudService)
    .useValue({
      getMedicalSpecialties: jest.fn().mockResolvedValue({
        Successful: true,
        Data: [
          { ESP_ID: 1, ESP_NOMBRE: 'Urología' },
          { ESP_ID: 2, ESP_NOMBRE: 'Andrología' }
        ]
      }),
      getDoctors: jest.fn().mockResolvedValue({
        Successful: true,
        Data: [
          { USU_ID: 1, USU_NOMBRE: 'Dr. García', USU_APELLIDOS: 'López' }
        ]
      }),
      getDoctorAgenda: jest.fn().mockResolvedValue({
        Successful: true,
        Data: {
          fechas: [
            {
              fecha: '2024-01-15',
              horas: [
                { hora: '09:00', disponible: true },
                { hora: '10:00', disponible: true }
              ]
            }
          ]
        }
      }),
      createPatient: jest.fn().mockResolvedValue({
        Successful: true,
        Data: { PAC_ID: 12345 }
      }),
      createAppointment: jest.fn().mockResolvedValue({
        Successful: true,
        Data: { CITA_ID: 67890 }
      })
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 120000);

  afterAll(async () => {
    await app.close();
    await mockServer.stop();
  });

  describe('Bootstrap Endpoint', () => {
    it('should return session data', async () => {
      const response = await request(app.getHttpServer())
        .get('/bootstrap')
        .expect(200);

      expect(response.body).toHaveProperty('locale');
      expect(response.body).toHaveProperty('theme');
      expect(response.body).toHaveProperty('features');
    });
  });

  describe('Medical Specialties', () => {
    it('should fetch medical specialties', async () => {
      const response = await request(app.getHttpServer())
        .get('/medical-specialties')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Doctors', () => {
    it('should fetch doctors for specialty', async () => {
      const response = await request(app.getHttpServer())
        .get('/doctors/1')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Doctor Availability', () => {
    it('should fetch doctor availability', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app.getHttpServer())
        .get(`/doctor-availability/1/${today}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('Token Management', () => {
    it('should return token statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/token-stats')
        .expect(200);

      expect(response.body).toHaveProperty('hasToken');
      expect(response.body).toHaveProperty('refreshCount');
      expect(response.body).toHaveProperty('isTestingMode');
    });
  });

  describe('Patient Operations', () => {
    it('should create patient', async () => {
      const patientData = {
        PAC_NOMBRE: 'Juan',
        PAC_APELLIDOS: 'Pérez',
        PAC_NIF: '12345678A',
        PAC_TELEFONO: '666123456',
        PAC_EMAIL: 'juan.perez@email.com'
      };

      const response = await request(app.getHttpServer())
        .post('/patient')
        .send(patientData)
        .expect(201);

      expect(response.body).toHaveProperty('PAC_ID');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Appointment Operations', () => {
    it('should create appointment', async () => {
      const appointmentData = {
        doctorId: 1,
        patientId: 12345,
        date: '2024-01-15T10:00:00',
        observations: 'Consulta de seguimiento'
      };

      const response = await request(app.getHttpServer())
        .post('/appointment')
        .send(appointmentData)
        .expect(201);

      expect(response.body).toHaveProperty('CITA_ID');
      expect(response.body).toHaveProperty('message');
    });
  });
});
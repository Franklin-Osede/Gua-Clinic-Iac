import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GUA API Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'gua-api');
    });
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

  describe('Token Statistics', () => {
    it('should return token statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/token-stats')
        .expect(200);

      expect(response.body).toHaveProperty('hasToken');
      expect(response.body).toHaveProperty('refreshCount');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Medical Specialties', () => {
    it('should handle medical specialties request', async () => {
      const response = await request(app.getHttpServer())
        .get('/medical-specialties')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});

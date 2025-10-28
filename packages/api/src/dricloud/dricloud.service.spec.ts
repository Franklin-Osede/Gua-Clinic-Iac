import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DriCloudService } from './dricloud.service';
import { of, throwError } from 'rxjs';

describe('DriCloudService', () => {
  let service: DriCloudService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          'DRICLOUD_WEBAPI2_USER': 'test_user',
          'DRICLOUD_WEBAPI2_PASSWORD': 'test_password',
          'DRICLOUD_CLINIC_ID': '123',
          'DRICLOUD_CLINIC_URL': 'test_clinic',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriCloudService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DriCloudService>(DriCloudService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  describe('makeDriCloudRequest', () => {
    it('should execute request successfully on first try', async () => {
      // Act
      const result = await service.makeDriCloudRequest(async () => {
        return { data: { Successful: true, Data: 'test' } };
      });

      // Assert
      expect(result).toEqual({ data: { Successful: true, Data: 'test' } });
    });

    it('should retry once on token conflict error', async () => {
      // Arrange
      const tokenError = {
        response: {
          data: {
            Successful: false,
            Html: 'Token incorrecto',
            Data: { ErrorCode: -1 }
          }
        }
      };

      let callCount = 0;
      const mockRequestFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw tokenError;
        }
        return { data: { Successful: true, Data: 'success' } };
      });

      // Mock refreshToken
      jest.spyOn(service as any, 'refreshToken').mockResolvedValue(undefined);

      // Act
      const result = await service.makeDriCloudRequest(mockRequestFn);

      // Assert
      expect(callCount).toBe(2);
      expect(result).toEqual({ data: { Successful: true, Data: 'success' } });
    });

    it('should throw error after one retry if still failing', async () => {
      // Arrange
      const tokenError = {
        response: {
          data: {
            Successful: false,
            Html: 'Token incorrecto',
            Data: { ErrorCode: -1 }
          }
        }
      };

      let callCount = 0;
      const mockRequestFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw tokenError;
        }
        // Segunda llamada también falla
        throw new Error('Still failing after retry');
      });

      // Mock refreshToken
      jest.spyOn(service as any, 'refreshToken').mockResolvedValue(undefined);

      // Act & Assert
      await expect(service.makeDriCloudRequest(mockRequestFn)).rejects.toThrow('Still failing after retry');
      expect(mockRequestFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-token errors', async () => {
      // Arrange
      const networkError = new Error('Network error');
      const mockRequestFn = jest.fn().mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.makeDriCloudRequest(mockRequestFn)).rejects.toThrow('Network error');
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isDriCloudTokenError', () => {
    it('should detect DriCloud token error correctly', () => {
      // Arrange
      const tokenError = {
        Successful: false,
        Html: 'Token incorrecto',
        Data: { ErrorCode: -1 }
      };

      // Act
      const result = (service as any).isDriCloudTokenError(tokenError);

      // Assert
      expect(result).toBe(true);
    });

    it('should not detect non-token errors', () => {
      // Arrange
      const otherError = {
        Successful: false,
        Html: 'Other error',
        Data: { ErrorCode: 1 }
      };

      // Act
      const result = (service as any).isDriCloudTokenError(otherError);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getMedicalSpecialties', () => {
    it('should call DriCloud API with protection', async () => {
      // Mock getValidToken
      jest.spyOn(service as any, 'getValidToken').mockResolvedValue('test_token');
      
      // Mock makeDriCloudRequest
      jest.spyOn(service as any, 'makeDriCloudRequest').mockResolvedValue({ data: [] });

      // Act
      await service.getMedicalSpecialties();

      // Assert
      expect(service.makeDriCloudRequest).toHaveBeenCalled();
    });
  });
});

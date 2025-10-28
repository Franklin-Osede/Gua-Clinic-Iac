import { Test, TestingModule } from '@nestjs/testing';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { DriCloudService } from '../dricloud/dricloud.service';

describe('DoctorAvailabilityService', () => {
  let service: DoctorAvailabilityService;
  let driCloudService: jest.Mocked<DriCloudService>;

  beforeEach(async () => {
    const mockDriCloudService = {
      getDoctorAgenda: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorAvailabilityService,
        {
          provide: DriCloudService,
          useValue: mockDriCloudService,
        },
      ],
    }).compile();

    service = module.get<DoctorAvailabilityService>(DoctorAvailabilityService);
    driCloudService = module.get(DriCloudService);
  });

  describe('getDoctorAgenda', () => {
    it('should call DriCloud service with correct parameters', async () => {
      // Arrange
      const doctorId = 1;
      const startDate = '2024-12-25';
      const datesToFetch = 31;
      const expectedResult = { data: 'test' };
      
      driCloudService.getDoctorAgenda.mockResolvedValue(expectedResult);

      // Act
      const result = await service.getDoctorAgenda(doctorId, startDate, datesToFetch);

      // Assert
      expect(driCloudService.getDoctorAgenda).toHaveBeenCalledWith(doctorId, startDate, datesToFetch);
      expect(result).toBe(expectedResult);
    });

    it('should handle DriCloud service errors', async () => {
      // Arrange
      const doctorId = 1;
      const startDate = '2024-12-25';
      const datesToFetch = 31;
      const error = new Error('DriCloud error');
      
      driCloudService.getDoctorAgenda.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getDoctorAgenda(doctorId, startDate, datesToFetch)).rejects.toThrow('DriCloud error');
    });
  });
});




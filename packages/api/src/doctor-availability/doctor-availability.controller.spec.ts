import { Test, TestingModule } from '@nestjs/testing';
import { DoctorAvailabilityController } from './doctor-availability.controller';
import { DoctorAvailabilityService } from './doctor-availability.service';

describe('DoctorAvailabilityController', () => {
  let controller: DoctorAvailabilityController;
  let service: jest.Mocked<DoctorAvailabilityService>;

  beforeEach(async () => {
    const mockService = {
      getDoctorAgenda: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorAvailabilityController],
      providers: [
        {
          provide: DoctorAvailabilityService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DoctorAvailabilityController>(DoctorAvailabilityController);
    service = module.get(DoctorAvailabilityService);
  });

  describe('getDoctorAgenda', () => {
    it('should call service with correct parameters', async () => {
      // Arrange
      const doctorId = 1;
      const startDate = '2024-12-25';
      const datesToFetch = 31;
      const expectedResult = { data: 'test' };
      
      service.getDoctorAgenda.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getDoctorAgenda(doctorId, startDate, datesToFetch);

      // Assert
      expect(service.getDoctorAgenda).toHaveBeenCalledWith(doctorId, startDate, datesToFetch);
      expect(result).toBe(expectedResult);
    });

    it('should use default datesToFetch when not provided', async () => {
      // Arrange
      const doctorId = 1;
      const startDate = '2024-12-25';
      const expectedResult = { data: 'test' };
      
      service.getDoctorAgenda.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getDoctorAgenda(doctorId, startDate);

      // Assert
      expect(service.getDoctorAgenda).toHaveBeenCalledWith(doctorId, startDate, 31);
      expect(result).toBe(expectedResult);
    });
  });
});




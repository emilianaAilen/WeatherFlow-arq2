import { ClimateMeasurementRepository } from './ClimateMeasurementRepository';
import { ClimateMeasurementModel } from '@/infrastructure/database/schemas/ClimateMeasurementSchema';
import { ClimateMeasurement, Location, Alert, Humidity, Pressure, Temperature, AlertType } from '@/domain';

jest.mock('@/infrastructure/database/schemas/ClimateMeasurementSchema');

describe('ClimateMeasurementRepository', () => {
  let repository: ClimateMeasurementRepository;

  beforeEach(() => {
    repository = new ClimateMeasurementRepository();
    jest.clearAllMocks();
  });

  describe('filterMeasurementsBy', () => {
    it('should build query with startDate and endDate', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      (ClimateMeasurementModel.find as jest.Mock).mockImplementation(mockFind);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await repository.filterMeasurementsBy({ startDate, endDate });

      expect(ClimateMeasurementModel.find).toHaveBeenCalledWith({
        dateTime: {
          $gte: startDate,
          $lte: endDate,
        },
      });
    });

    it('should build query with only startDate', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      (ClimateMeasurementModel.find as jest.Mock).mockImplementation(mockFind);

      const startDate = new Date('2024-01-01');

      await repository.filterMeasurementsBy({ startDate });

      expect(ClimateMeasurementModel.find).toHaveBeenCalledWith({
        dateTime: {
          $gte: startDate,
        },
      });
    });

    it('should build query with only endDate', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      (ClimateMeasurementModel.find as jest.Mock).mockImplementation(mockFind);

      const endDate = new Date('2024-01-31');

      await repository.filterMeasurementsBy({ endDate });

      expect(ClimateMeasurementModel.find).toHaveBeenCalledWith({
        dateTime: {
          $lte: endDate,
        },
      });
    });
  });
});

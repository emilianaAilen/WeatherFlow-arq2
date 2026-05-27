import { ClimateMeasurementRepository } from './ClimateMeasurementRepository';
import { ClimateMeasurementModel } from '@/infrastructure/database/schemas/ClimateMeasurementSchema';

jest.mock('@/infrastructure/database/schemas/ClimateMeasurementSchema');

describe('ClimateMeasurementRepository', () => {
  let repository: ClimateMeasurementRepository;

  beforeEach(() => {
    repository = new ClimateMeasurementRepository();
    jest.clearAllMocks();
  });

  describe('filterMeasurementsBy', () => {

    it('should build query with humidity and pressure filters', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      (ClimateMeasurementModel.find as jest.Mock).mockImplementation(mockFind);

      await repository.filterMeasurementsBy({
        minHumidity: 40,
        maxHumidity: 80,
        minPressure: 1000,
        maxPressure: 1020,
      });

      expect(ClimateMeasurementModel.find).toHaveBeenCalledWith({
        humidity: { $gte: 40, $lte: 80 },
        atmosphericPressure: { $gte: 1000, $lte: 1020 },
      });
    });
  });
});

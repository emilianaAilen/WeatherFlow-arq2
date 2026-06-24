import { ClimateMeasurementRepository } from './ClimateMeasurementRepository';
import { ClimateMeasurementModel } from '@/infrastructure/database/schemas/ClimateMeasurementSchema';

jest.mock('@/infrastructure/database/schemas/ClimateMeasurementSchema');

describe('ClimateMeasurementRepository', () => {
  let repository: ClimateMeasurementRepository;

  beforeEach(() => {
    repository = new ClimateMeasurementRepository();
    jest.clearAllMocks();
  });

  describe('findLatestByStationId', () => {
    it('should query by stationId sorted by dateTime descending', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockFindOne = jest.fn().mockReturnValue({ sort: mockSort });
      (ClimateMeasurementModel.findOne as jest.Mock).mockImplementation(mockFindOne);

      const result = await repository.findLatestByStationId('station-id');

      expect(ClimateMeasurementModel.findOne).toHaveBeenCalledWith({ stationId: 'station-id' });
      expect(mockSort).toHaveBeenCalledWith({ dateTime: -1 });
      expect(result).toBeNull();
    });

    it('should return the mapped domain measurement when a document is found', async () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const mockDoc = {
        _id: { toString: () => 'meas-id' },
        temperature: 22,
        humidity: 55,
        atmosphericPressure: 1010,
        dateTime: date,
        stationId: { toString: () => 'station-id' },
      };
      const mockExec = jest.fn().mockResolvedValue(mockDoc);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      (ClimateMeasurementModel.findOne as jest.Mock).mockReturnValue({ sort: mockSort });

      const result = await repository.findLatestByStationId('station-id');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('meas-id');
      expect(result!.temperature.value).toBe(22);
      expect(result!.stationId).toBe('station-id');
    });
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

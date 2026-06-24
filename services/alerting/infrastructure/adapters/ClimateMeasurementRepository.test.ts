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

  describe('getHourlyTemperaturesByStationId', () => {
    it('should aggregate by hour and return mapped results sorted ascending', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      const hourTimestamp = new Date('2024-01-01T14:00:00Z').getTime();
      const mockExec = jest.fn().mockResolvedValue([{ _id: hourTimestamp, averageTemperature: 22.5 }]);
      (ClimateMeasurementModel.aggregate as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.getHourlyTemperaturesByStationId('station-id', since);

      expect(ClimateMeasurementModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          { $match: { stationId: 'station-id', dateTime: { $gte: since } } },
          { $sort: { _id: 1 } },
        ]),
      );
      expect(result).toHaveLength(1);
      expect(result[0].averageTemperature).toBe(22.5);
      expect(result[0].hourStart).toEqual(new Date(hourTimestamp));
    });

    it('should return an empty array when no documents match', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      (ClimateMeasurementModel.aggregate as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.getHourlyTemperaturesByStationId('station-id', new Date());

      expect(result).toEqual([]);
    });
  });

  describe('getWeeklyAverageTemperatureByStationId', () => {
    it('should aggregate by day and return mapped results sorted ascending', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      const dayTimestamp = new Date('2024-01-01T00:00:00Z').getTime();
      const mockExec = jest.fn().mockResolvedValue([{ _id: dayTimestamp, averageTemperature: 21.8 }]);
      (ClimateMeasurementModel.aggregate as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.getWeeklyAverageTemperatureByStationId('station-id', since);

      expect(ClimateMeasurementModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          { $match: { stationId: 'station-id', dateTime: { $gte: since } } },
          { $sort: { _id: 1 } },
        ]),
      );
      expect(result).toHaveLength(1);
      expect(result[0].averageTemperature).toBe(21.8);
      expect(result[0].dayStart).toEqual(new Date(dayTimestamp));
    });

    it('should return an empty array when no documents match', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      (ClimateMeasurementModel.aggregate as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.getWeeklyAverageTemperatureByStationId('station-id', new Date());

      expect(result).toEqual([]);
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

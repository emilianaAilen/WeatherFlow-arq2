import { ClimateMeasurementService } from './ClimateMeasurementService';
import { IClimateMeasurementRepository } from '@/infrastructure/ports/IClimateMeasurementRepository';
import { IStationReadModelRepository } from '@/infrastructure/ports/IStationReadModelRepository';
import { INotificationQueue } from '@/infrastructure/ports/INotificationQueue';
import { ClimateMeasurement } from '@/domain';
import { MeasurementFilters } from '@/user-interface/dtos/MeasurementFiltersDTO';

describe('ClimateMeasurementService', () => {
  let climateMeasurementRepository: jest.Mocked<IClimateMeasurementRepository>;
  let stationReadModelRepository: jest.Mocked<IStationReadModelRepository>;
  let notificationQueue: jest.Mocked<INotificationQueue>;
  let service: ClimateMeasurementService;

  beforeEach(() => {
    climateMeasurementRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByStationId: jest.fn(),
      filterMeasurementsBy: jest.fn(),
      getAll: jest.fn(),
    };
    stationReadModelRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    notificationQueue = {
      publish: jest.fn(),
    };

    service = new ClimateMeasurementService(
      climateMeasurementRepository,
      stationReadModelRepository,
      notificationQueue
    );
  });

  it('should create a measurement when station exists', async () => {
    stationReadModelRepository.findById.mockResolvedValue({ id: 'station-id', name: 'Station' });

    const result = await service.createMeasurement({
      temperature: 25,
      humidity: 50,
      atmosphericPressure: 1013,
      stationId: 'station-id',
    });

    expect(stationReadModelRepository.findById).toHaveBeenCalledWith('station-id');
    expect(climateMeasurementRepository.save).toHaveBeenCalledTimes(1);
    expect(result.stationId).toBe('station-id');
  });

  it('should throw error when creating measurement for non-existent station', async () => {
    stationReadModelRepository.findById.mockResolvedValue(null);

    await expect(
      service.createMeasurement({
        temperature: 25,
        humidity: 50,
        atmosphericPressure: 1013,
        stationId: 'invalid-id',
      })
    ).rejects.toThrow('Weather station not found');
  });

  it('should search measurements by station name', async () => {
    stationReadModelRepository.findByName.mockResolvedValue({ id: 'station-id', name: 'Station' });
    climateMeasurementRepository.filterMeasurementsBy.mockResolvedValue([]);

    const filters: MeasurementFilters = { stationName: 'Station' };
    const result = await service.search(filters);

    expect(stationReadModelRepository.findByName).toHaveBeenCalledWith('Station');
    expect(climateMeasurementRepository.filterMeasurementsBy).toHaveBeenCalledWith(
      expect.objectContaining({ stationId: 'station-id' })
    );
    expect(result).toEqual([]);
  });

  it('should return empty array if station name not found during search', async () => {
    stationReadModelRepository.findByName.mockResolvedValue(null);

    const filters: MeasurementFilters = { stationName: 'Unknown' };
    const result = await service.search(filters);

    expect(result).toEqual([]);
    expect(climateMeasurementRepository.filterMeasurementsBy).not.toHaveBeenCalled();
  });
});

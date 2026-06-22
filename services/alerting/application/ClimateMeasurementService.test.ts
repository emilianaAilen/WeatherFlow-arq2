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
      findLatestByStationId: jest.fn(),
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
      notificationQueue,
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
    expect(notificationQueue.publish).not.toHaveBeenCalled();
  });

  it('should publish to queue when creating an active alert measurement', async () => {
    stationReadModelRepository.findById.mockResolvedValue({ id: 'station-id', name: 'Station' });

    await service.createMeasurement({
      temperature: 50, // very high temperature -> ALARM
      humidity: 50,
      atmosphericPressure: 1013,
      stationId: 'station-id',
    });

    expect(notificationQueue.publish).toHaveBeenCalled();
  });

  it('should throw error when creating measurement for non-existent station', async () => {
    stationReadModelRepository.findById.mockResolvedValue(null);

    await expect(
      service.createMeasurement({
        temperature: 25,
        humidity: 50,
        atmosphericPressure: 1013,
        stationId: 'invalid-id',
      }),
    ).rejects.toThrow('Weather station not found');
  });

  it('should search measurements by station name', async () => {
    stationReadModelRepository.findByName.mockResolvedValue({ id: 'station-id', name: 'Station' });
    climateMeasurementRepository.filterMeasurementsBy.mockResolvedValue([]);

    const filters: MeasurementFilters = { stationName: 'Station' };
    const result = await service.search(filters);

    expect(stationReadModelRepository.findByName).toHaveBeenCalledWith('Station');
    expect(climateMeasurementRepository.filterMeasurementsBy).toHaveBeenCalledWith(
      expect.objectContaining({ stationId: 'station-id' }),
    );
    expect(result).toEqual([]);
  });

  it('should pass climate parameter filters to repository', async () => {
    climateMeasurementRepository.filterMeasurementsBy.mockResolvedValue([]);

    await service.search({ minHumidity: 40, maxHumidity: 80 });
    expect(climateMeasurementRepository.filterMeasurementsBy).toHaveBeenCalledWith(
      expect.objectContaining({ minHumidity: 40, maxHumidity: 80 }),
    );

    await service.search({ minPressure: 1000, maxPressure: 1020 });
    expect(climateMeasurementRepository.filterMeasurementsBy).toHaveBeenCalledWith(
      expect.objectContaining({ minPressure: 1000, maxPressure: 1020 }),
    );
  });

  it('should return empty array if station name not found during search', async () => {
    stationReadModelRepository.findByName.mockResolvedValue(null);

    const filters: MeasurementFilters = { stationName: 'Unknown' };
    const result = await service.search(filters);

    expect(result).toEqual([]);
    expect(climateMeasurementRepository.filterMeasurementsBy).not.toHaveBeenCalled();
  });

  describe('getMeasurementById', () => {
    it('should return measurement if found', async () => {
      const measurement = ClimateMeasurement.create('id', 20, 50, 1013, new Date(), 'sid');
      climateMeasurementRepository.findById.mockResolvedValue(measurement);
      const result = await service.getMeasurementById('id');
      expect(result).toEqual(measurement);
    });

    it('should return null if not found', async () => {
      climateMeasurementRepository.findById.mockResolvedValue(null);
      const result = await service.getMeasurementById('id');
      expect(result).toBeNull();
    });
  });

  describe('deleteMeasurement', () => {
    it('should delete if found', async () => {
      const measurement = ClimateMeasurement.create('id', 20, 50, 1013, new Date(), 'sid');
      climateMeasurementRepository.findById.mockResolvedValue(measurement);
      await service.deleteMeasurement('id');
      expect(climateMeasurementRepository.remove).toHaveBeenCalledWith('id');
    });

    it('should throw 404 if not found', async () => {
      climateMeasurementRepository.findById.mockResolvedValue(null);
      await expect(service.deleteMeasurement('id')).rejects.toThrow(
        'Climate measurement not found',
      );
    });
  });

  describe('getCurrentMeasurementByStationId', () => {
    it('should return the latest measurement for a station', async () => {
      const measurement = ClimateMeasurement.create('id', 20, 50, 1013, new Date(), 'station-id');
      climateMeasurementRepository.findLatestByStationId.mockResolvedValue(measurement);

      const result = await service.getCurrentMeasurementByStationId('station-id');

      expect(climateMeasurementRepository.findLatestByStationId).toHaveBeenCalledWith('station-id');
      expect(result).toEqual(measurement);
    });

    it('should return null if station has no measurements', async () => {
      climateMeasurementRepository.findLatestByStationId.mockResolvedValue(null);

      const result = await service.getCurrentMeasurementByStationId('station-id');

      expect(result).toBeNull();
    });
  });

  describe('updateMeasurement', () => {
    it('should update and not publish if no alert', async () => {
      const measurement = ClimateMeasurement.create('id', 20, 50, 1013, new Date(), 'sid');
      climateMeasurementRepository.findById.mockResolvedValue(measurement);

      const result = await service.updateMeasurement('id', { temperature: 25 });
      expect(climateMeasurementRepository.update).toHaveBeenCalled();
      expect(result.temperature.value).toBe(25);
      expect(notificationQueue.publish).not.toHaveBeenCalled();
    });

    it('should update and publish if alert is active', async () => {
      const measurement = ClimateMeasurement.create('id', 20, 50, 1013, new Date(), 'sid');
      climateMeasurementRepository.findById.mockResolvedValue(measurement);

      await service.updateMeasurement('id', { temperature: 50 }); // ALARM
      expect(notificationQueue.publish).toHaveBeenCalled();
    });

    it('should throw 404 if not found on update', async () => {
      climateMeasurementRepository.findById.mockResolvedValue(null);
      await expect(service.updateMeasurement('id', { temperature: 25 })).rejects.toThrow(
        'Climate measurement not found',
      );
    });
  });
});

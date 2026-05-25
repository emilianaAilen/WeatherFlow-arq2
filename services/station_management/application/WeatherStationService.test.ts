import { WeatherStationService } from './WeatherStationService';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { IClimateMeasurementRepository } from '@/infrastructure/ports/IClimateMeasurementRepository';
import { IStationEventPublisher } from '@/infrastructure/ports/IStationEventPublisher';
import { WeatherStation, User, Location, StationStatusType } from '@/domain';

describe('WeatherStationService', () => {
  let weatherStationRepository: jest.Mocked<IWeatherStationRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let climateMeasurementRepository: jest.Mocked<IClimateMeasurementRepository>;
  let stationEventPublisher: jest.Mocked<IStationEventPublisher>;
  let service: WeatherStationService;

  beforeEach(() => {
    weatherStationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findStationByOwner: jest.fn(),
      findStationByName: jest.fn(),
      getAll: jest.fn(),
    };
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getAll: jest.fn(),
    };
    climateMeasurementRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByStationId: jest.fn(),
      filterMeasurementsBy: jest.fn(),
      getAll: jest.fn(),
    };
    stationEventPublisher = {
      publishStationCreated: jest.fn(),
      publishStationUpdated: jest.fn(),
      publishStationDeleted: jest.fn(),
    };

    service = new WeatherStationService(
      weatherStationRepository,
      userRepository,
      climateMeasurementRepository,
      stationEventPublisher
    );
  });

  it('should create a weather station and publish event', async () => {
    const owner = User.create('owner-id', 'John', 'Doe', 'john@test.com');
    userRepository.findById.mockResolvedValue(owner);
    weatherStationRepository.findStationByName.mockResolvedValue(null);

    const result = await service.createWeatherStation({
      name: 'Station A',
      location: { latitude: 10, longitude: 20 },
      model: 'ModelX',
      ownerId: 'owner-id',
    });

    expect(weatherStationRepository.save).toHaveBeenCalledTimes(1);
    expect(stationEventPublisher.publishStationCreated).toHaveBeenCalledWith(result);
    expect(result.getName()).toBe('Station A');
  });

  it('should update a weather station and publish event', async () => {
    const existingStation = WeatherStation.create('station-id', 'Station Old', Location.create(0, 0), 'Model', StationStatusType.ACTIVE, 'owner-id');
    weatherStationRepository.findById.mockResolvedValue(existingStation);
    weatherStationRepository.findStationByName.mockResolvedValue(null);

    const result = await service.updateWeatherStation('station-id', {
      name: 'Station New',
    });

    expect(weatherStationRepository.update).toHaveBeenCalledTimes(1);
    expect(stationEventPublisher.publishStationUpdated).toHaveBeenCalledWith(result);
    expect(result.getName()).toBe('Station New');
  });

  it('should delete a weather station and publish event', async () => {
    const existingStation = WeatherStation.create('station-id', 'Station Old', Location.create(0, 0), 'Model', StationStatusType.ACTIVE, 'owner-id');
    weatherStationRepository.findById.mockResolvedValue(existingStation);
    climateMeasurementRepository.findByStationId.mockResolvedValue(null);

    await service.deleteStation('station-id');

    expect(weatherStationRepository.remove).toHaveBeenCalledWith('station-id');
    expect(stationEventPublisher.publishStationDeleted).toHaveBeenCalledWith('station-id');
  });
});

import { WeatherStationService } from './WeatherStationService';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { IStationEventPublisher } from '@/infrastructure/ports/IStationEventPublisher';
import { WeatherStation, User, Location, StationStatusType } from '@/domain';

describe('WeatherStationService', () => {
  let weatherStationRepository: jest.Mocked<IWeatherStationRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
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
    stationEventPublisher = {
      publishStationCreated: jest.fn(),
      publishStationUpdated: jest.fn(),
      publishStationDeleted: jest.fn(),
    };

    service = new WeatherStationService(
      weatherStationRepository,
      userRepository,
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

    await service.deleteStation('station-id');

    expect(weatherStationRepository.remove).toHaveBeenCalledWith('station-id');
    expect(stationEventPublisher.publishStationDeleted).toHaveBeenCalledWith('station-id');
  });

  it('should return a station when searching by existing name', async () => {
    const station = WeatherStation.create('station-id', 'Station Alpha', Location.create(10, 20), 'ModelX', StationStatusType.ACTIVE, 'owner-id');
    weatherStationRepository.findStationByName.mockResolvedValue(station);

    const result = await service.searchByName('Station Alpha');

    expect(weatherStationRepository.findStationByName).toHaveBeenCalledWith('Station Alpha');
    expect(result).toBe(station);
  });

  it('should return null when searching by a name that does not exist', async () => {
    weatherStationRepository.findStationByName.mockResolvedValue(null);

    const result = await service.searchByName('Nonexistent Station');

    expect(weatherStationRepository.findStationByName).toHaveBeenCalledWith('Nonexistent Station');
    expect(result).toBeNull();
  });
});

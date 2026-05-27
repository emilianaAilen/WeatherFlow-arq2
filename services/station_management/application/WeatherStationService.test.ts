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
      stationEventPublisher,
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

  it('should throw 404 if owner not found on create', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(
      service.createWeatherStation({
        name: 'Station A',
        location: { latitude: 10, longitude: 20 },
        model: 'ModelX',
        ownerId: 'owner-id',
      }),
    ).rejects.toThrow('Owner not found');
  });

  it('should throw 409 if name already taken on create', async () => {
    const owner = User.create('owner-id', 'John', 'Doe', 'john@test.com');
    userRepository.findById.mockResolvedValue(owner);
    const existingStation = WeatherStation.create(
      'station-id',
      'Station A',
      Location.create(0, 0),
      'Model',
      StationStatusType.ACTIVE,
      'owner-id',
    );
    weatherStationRepository.findStationByName.mockResolvedValue(existingStation);

    await expect(
      service.createWeatherStation({
        name: 'Station A',
        location: { latitude: 10, longitude: 20 },
        model: 'ModelX',
        ownerId: 'owner-id',
      }),
    ).rejects.toThrow('A weather station with that name already exists');
  });

  it('should update a weather station and publish event', async () => {
    const existingStation = WeatherStation.create(
      'station-id',
      'Station Old',
      Location.create(0, 0),
      'Model',
      StationStatusType.ACTIVE,
      'owner-id',
    );
    weatherStationRepository.findById.mockResolvedValue(existingStation);
    weatherStationRepository.findStationByName.mockResolvedValue(null);

    const result = await service.updateWeatherStation('station-id', {
      name: 'Station New',
    });

    expect(weatherStationRepository.update).toHaveBeenCalledTimes(1);
    expect(stationEventPublisher.publishStationUpdated).toHaveBeenCalledWith(result);
    expect(result.getName()).toBe('Station New');
  });

  it('should throw 404 if station not found on update', async () => {
    weatherStationRepository.findById.mockResolvedValue(null);
    await expect(
      service.updateWeatherStation('station-id', { name: 'Station New' }),
    ).rejects.toThrow('Weather station not found');
  });

  it('should throw 409 if new name already taken on update', async () => {
    const existingStation = WeatherStation.create(
      'station-id',
      'Station Old',
      Location.create(0, 0),
      'Model',
      StationStatusType.ACTIVE,
      'owner-id',
    );
    const otherStation = WeatherStation.create(
      'other-id',
      'Station New',
      Location.create(0, 0),
      'Model',
      StationStatusType.ACTIVE,
      'owner-id',
    );
    weatherStationRepository.findById.mockResolvedValue(existingStation);
    weatherStationRepository.findStationByName.mockResolvedValue(otherStation);

    await expect(
      service.updateWeatherStation('station-id', { name: 'Station New' }),
    ).rejects.toThrow('A weather station with that name already exists');
  });

  it('should delete a weather station and publish event', async () => {
    const existingStation = WeatherStation.create(
      'station-id',
      'Station Old',
      Location.create(0, 0),
      'Model',
      StationStatusType.ACTIVE,
      'owner-id',
    );
    weatherStationRepository.findById.mockResolvedValue(existingStation);

    await service.deleteStation('station-id');

    expect(weatherStationRepository.remove).toHaveBeenCalledWith('station-id');
    expect(stationEventPublisher.publishStationDeleted).toHaveBeenCalledWith('station-id');
  });

  it('should return a station when searching by existing name', async () => {
    const station = WeatherStation.create(
      'station-id',
      'Station Alpha',
      Location.create(10, 20),
      'ModelX',
      StationStatusType.ACTIVE,
      'owner-id',
    );
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

  it('should throw 404 if station not found on delete', async () => {
    weatherStationRepository.findById.mockResolvedValue(null);
    await expect(service.deleteStation('station-id')).rejects.toThrow('Weather station not found');
  });

  it('should return a station if found', async () => {
    const existingStation = WeatherStation.create(
      'station-id',
      'Station Old',
      Location.create(0, 0),
      'Model',
      StationStatusType.ACTIVE,
      'owner-id',
    );
    weatherStationRepository.findById.mockResolvedValue(existingStation);
    const result = await service.getStationById('station-id');
    expect(result).toEqual(existingStation);
  });

  it('should return a list of stations', async () => {
    const existingStation = WeatherStation.create(
      'station-id',
      'Station Old',
      Location.create(0, 0),
      'Model',
      StationStatusType.ACTIVE,
      'owner-id',
    );
    weatherStationRepository.getAll.mockResolvedValue([existingStation]);
    const result = await service.getAllStations();
    expect(result).toEqual([existingStation]);
  });
});

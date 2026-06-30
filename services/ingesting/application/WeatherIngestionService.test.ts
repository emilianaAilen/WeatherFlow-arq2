import { WeatherIngestionService } from './WeatherIngestionService';
import { IMonitoredStationRepository, IWeatherClient, IMeasurementPublisher } from '@/infrastructure/ports';
import { MonitoredStation } from '@/domain';
import { logger } from '@/infrastructure/logger';

const makeStation = (id: string, lat: number, lon: number): MonitoredStation =>
  new MonitoredStation(id, `Station ${id}`, id, lat, lon);

describe('WeatherIngestionService', () => {
  let monitoredStationRepository: jest.Mocked<IMonitoredStationRepository>;
  let weatherClient: jest.Mocked<IWeatherClient>;
  let measurementPublisher: jest.Mocked<IMeasurementPublisher>;
  let service: WeatherIngestionService;

  const weatherData = { temperature: 22.5, humidity: 55, pressure: 1015 };

  beforeEach(() => {
    monitoredStationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    weatherClient = { fetchWeather: jest.fn() };
    measurementPublisher = { publish: jest.fn() };

    service = new WeatherIngestionService(monitoredStationRepository, weatherClient, measurementPublisher);
  });

  afterEach(() => jest.clearAllMocks());

  it('should fetch weather and publish measurement for each station', async () => {
    const stations = [makeStation('s-1', -34.6037, -58.3816), makeStation('s-2', 10.5, 20.3)];
    monitoredStationRepository.findAll.mockResolvedValue(stations);
    weatherClient.fetchWeather.mockResolvedValue(weatherData);
    measurementPublisher.publish.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(weatherClient.fetchWeather).toHaveBeenCalledTimes(2);
    expect(weatherClient.fetchWeather).toHaveBeenCalledWith(-34.6037, -58.3816);
    expect(weatherClient.fetchWeather).toHaveBeenCalledWith(10.5, 20.3);
    expect(measurementPublisher.publish).toHaveBeenCalledTimes(2);
  });

  it('should map weather data to measurement message correctly', async () => {
    monitoredStationRepository.findAll.mockResolvedValue([makeStation('s-1', 0, 0)]);
    weatherClient.fetchWeather.mockResolvedValue({ temperature: 30, humidity: 80, pressure: 990 });
    measurementPublisher.publish.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(measurementPublisher.publish).toHaveBeenCalledWith({
      temperature: 30,
      humidity: 80,
      atmosphericPressure: 990,
      stationId: 's-1',
    });
  });

  it('should use alertingStationId as stationId in the published message', async () => {
    const station = new MonitoredStation('ingest-id', 'Station', 'alerting-id', 0, 0);
    monitoredStationRepository.findAll.mockResolvedValue([station]);
    weatherClient.fetchWeather.mockResolvedValue(weatherData);
    measurementPublisher.publish.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(measurementPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ stationId: 'alerting-id' }),
    );
  });

  it('should skip a station and continue when fetchWeather returns null (circuit breaker open)', async () => {
    const loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => false);
    const stations = [makeStation('s-1', 0, 0), makeStation('s-2', 10, 20)];
    monitoredStationRepository.findAll.mockResolvedValue(stations);
    weatherClient.fetchWeather
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(weatherData);
    measurementPublisher.publish.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(weatherClient.fetchWeather).toHaveBeenCalledTimes(2);
    expect(measurementPublisher.publish).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(expect.objectContaining({ stationId: 's-1' }), expect.any(String));
    loggerWarnSpy.mockRestore();
  });

  it('should continue with remaining stations when OWM fails for one (bulkhead)', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => false);
    const stations = [makeStation('s-1', 0, 0), makeStation('s-2', 10, 20)];
    monitoredStationRepository.findAll.mockResolvedValue(stations);
    weatherClient.fetchWeather
      .mockRejectedValueOnce(new Error('OWM down'))
      .mockResolvedValueOnce(weatherData);
    measurementPublisher.publish.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(weatherClient.fetchWeather).toHaveBeenCalledTimes(2);
    expect(measurementPublisher.publish).toHaveBeenCalledTimes(1);
    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ stationId: 's-1' }), expect.any(String));
    loggerErrorSpy.mockRestore();
  });

  it('should continue with remaining stations when publish fails for one (bulkhead)', async () => {
    const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => false);
    const stations = [makeStation('s-1', 0, 0), makeStation('s-2', 10, 20)];
    monitoredStationRepository.findAll.mockResolvedValue(stations);
    weatherClient.fetchWeather.mockResolvedValue(weatherData);
    measurementPublisher.publish
      .mockRejectedValueOnce(new Error('RabbitMQ down'))
      .mockResolvedValueOnce(undefined);

    await service.runIngestionCycle();

    expect(measurementPublisher.publish).toHaveBeenCalledTimes(2);
    expect(loggerErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ stationId: 's-1' }), expect.any(String));
    loggerErrorSpy.mockRestore();
  });

  it('should do nothing when there are no monitored stations', async () => {
    monitoredStationRepository.findAll.mockResolvedValue([]);

    await service.runIngestionCycle();

    expect(weatherClient.fetchWeather).not.toHaveBeenCalled();
    expect(measurementPublisher.publish).not.toHaveBeenCalled();
  });
});

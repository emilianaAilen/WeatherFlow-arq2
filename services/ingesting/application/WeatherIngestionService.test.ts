import { WeatherIngestionService } from './WeatherIngestionService';
import { IMonitoredStationRepository, IOWMWeatherClient, IAlertingClient } from '@/infrastructure/ports';
import { MonitoredStation } from '@/domain';

const makeStation = (id: string, lat: number, lon: number): MonitoredStation =>
  new MonitoredStation(id, `Station ${id}`, id, lat, lon);

describe('WeatherIngestionService', () => {
  let monitoredStationRepository: jest.Mocked<IMonitoredStationRepository>;
  let owmClient: jest.Mocked<IOWMWeatherClient>;
  let alertingClient: jest.Mocked<IAlertingClient>;
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

    owmClient = { fetchWeather: jest.fn() };
    alertingClient = { postMeasurement: jest.fn() };

    service = new WeatherIngestionService(monitoredStationRepository, owmClient, alertingClient);
  });

  afterEach(() => jest.clearAllMocks());

  it('should fetch and forward weather data for each station', async () => {
    const stations = [makeStation('s-1', -34.6037, -58.3816), makeStation('s-2', 10.5, 20.3)];
    monitoredStationRepository.findAll.mockResolvedValue(stations);
    owmClient.fetchWeather.mockResolvedValue(weatherData);
    alertingClient.postMeasurement.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(owmClient.fetchWeather).toHaveBeenCalledTimes(2);
    expect(owmClient.fetchWeather).toHaveBeenCalledWith(-34.6037, -58.3816);
    expect(owmClient.fetchWeather).toHaveBeenCalledWith(10.5, 20.3);
    expect(alertingClient.postMeasurement).toHaveBeenCalledTimes(2);
  });

  it('should map OWM response to alerting payload correctly', async () => {
    monitoredStationRepository.findAll.mockResolvedValue([makeStation('s-1', 0, 0)]);
    owmClient.fetchWeather.mockResolvedValue({ temperature: 30, humidity: 80, pressure: 990 });
    alertingClient.postMeasurement.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(alertingClient.postMeasurement).toHaveBeenCalledWith({
      temperature: 30,
      humidity: 80,
      atmosphericPressure: 990,
      stationId: 's-1',
    });
  });

  it('should use alertingStationId (not id) as stationId in the payload', async () => {
    const station = new MonitoredStation('ingest-id', 'Station', 'alerting-id', 0, 0);
    monitoredStationRepository.findAll.mockResolvedValue([station]);
    owmClient.fetchWeather.mockResolvedValue(weatherData);
    alertingClient.postMeasurement.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(alertingClient.postMeasurement).toHaveBeenCalledWith(
      expect.objectContaining({ stationId: 'alerting-id' }),
    );
  });

  it('should continue with remaining stations when OWM fails for one (bulkhead)', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const stations = [makeStation('s-1', 0, 0), makeStation('s-2', 10, 20)];
    monitoredStationRepository.findAll.mockResolvedValue(stations);
    owmClient.fetchWeather
      .mockRejectedValueOnce(new Error('OWM down'))
      .mockResolvedValueOnce(weatherData);
    alertingClient.postMeasurement.mockResolvedValue(undefined);

    await service.runIngestionCycle();

    expect(owmClient.fetchWeather).toHaveBeenCalledTimes(2);
    expect(alertingClient.postMeasurement).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('s-1'), expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should continue with remaining stations when alerting fails for one (bulkhead)', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const stations = [makeStation('s-1', 0, 0), makeStation('s-2', 10, 20)];
    monitoredStationRepository.findAll.mockResolvedValue(stations);
    owmClient.fetchWeather.mockResolvedValue(weatherData);
    alertingClient.postMeasurement
      .mockRejectedValueOnce(new Error('Alerting down'))
      .mockResolvedValueOnce(undefined);

    await service.runIngestionCycle();

    expect(alertingClient.postMeasurement).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('s-1'), expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('should do nothing when there are no monitored stations', async () => {
    monitoredStationRepository.findAll.mockResolvedValue([]);

    await service.runIngestionCycle();

    expect(owmClient.fetchWeather).not.toHaveBeenCalled();
    expect(alertingClient.postMeasurement).not.toHaveBeenCalled();
  });
});

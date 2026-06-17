import { IMonitoredStationRepository, IOWMWeatherClient, IAlertingClient } from '@/infrastructure/ports';

export class WeatherIngestionService {
  constructor(
    private readonly monitoredStationRepository: IMonitoredStationRepository,
    private readonly owmClient: IOWMWeatherClient,
    private readonly alertingClient: IAlertingClient,
  ) {}

  async runIngestionCycle(): Promise<void> {
    const stations = await this.monitoredStationRepository.findAll();

    for (const station of stations) {
      try {
        const weather = await this.owmClient.fetchWeather(station.latitude, station.longitude);
        await this.alertingClient.postMeasurement({
          temperature: weather.temperature,
          humidity: weather.humidity,
          atmosphericPressure: weather.pressure,
          stationId: station.alertingStationId,
        });
        console.info(`Ingested weather data for station ${station.id}`);
      } catch (error) {
        console.error(`Failed to ingest weather data for station ${station.id}`, error);
      }
    }
  }
}

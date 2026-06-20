import { IMonitoredStationRepository, IWeatherClient, IMeasurementPublisher } from '@/infrastructure/ports';

export class WeatherIngestionService {
  constructor(
    private readonly monitoredStationRepository: IMonitoredStationRepository,
    private readonly weatherClient: IWeatherClient,
    private readonly measurementPublisher: IMeasurementPublisher,
  ) {}

  async runIngestionCycle(): Promise<void> {
    const stations = await this.monitoredStationRepository.findAll();

    for (const station of stations) {
      try {
        const weather = await this.weatherClient.fetchWeather(station.latitude, station.longitude);
        await this.measurementPublisher.publish({
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

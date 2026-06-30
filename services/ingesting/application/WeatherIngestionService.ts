import { IMonitoredStationRepository, IWeatherClient, IMeasurementPublisher } from '@/infrastructure/ports';
import { logger } from '@/infrastructure/logger';

export class WeatherIngestionService {
  constructor(
    private readonly monitoredStationRepository: IMonitoredStationRepository,
    private readonly weatherClient: IWeatherClient,
    private readonly measurementPublisher: IMeasurementPublisher,
  ) {}

  async runIngestionCycle(): Promise<void> {
    const stations = await this.monitoredStationRepository.findAll();
    const cycleStart = Date.now();
    let succeeded = 0;
    let failed = 0;

    logger.info({ stationCount: stations.length }, 'Ingestion cycle started');

    for (const station of stations) {
      const stationStart = Date.now();
      try {
        const weather = await this.weatherClient.fetchWeather(station.latitude, station.longitude);
        if (weather === null) {
          failed++;
          logger.warn({ stationId: station.id }, 'Station skipped — weather data unavailable');
          continue;
        }
        await this.measurementPublisher.publish({
          temperature: weather.temperature,
          humidity: weather.humidity,
          atmosphericPressure: weather.pressure,
          stationId: station.alertingStationId,
        });
        succeeded++;
        logger.info(
          { stationId: station.id, lat: station.latitude, lon: station.longitude,
            temperature: weather.temperature, humidity: weather.humidity, pressure: weather.pressure,
            durationMs: Date.now() - stationStart },
          'Station ingested',
        );
      } catch (error) {
        failed++;
        logger.error({ stationId: station.id, error: (error as Error).message }, 'Failed to ingest station');
      }
    }

    logger.info(
      { succeeded, failed, total: stations.length, durationMs: Date.now() - cycleStart },
      'Ingestion cycle completed',
    );
  }
}

import { z } from 'zod';
import { IWeatherClient, WeatherData } from '@/infrastructure/ports';
import { CircuitBreaker, CircuitOpenError } from '@/infrastructure/fault-tolerance/CircuitBreaker';
import { logger } from '@/infrastructure/logger';
import { owmFetchTotal } from '@/infrastructure/telemetry/metrics';

const OWMResponseSchema = z.object({
  main: z.object({
    temp: z.number(),
    humidity: z.number(),
    pressure: z.number(),
  }),
});

export class OWMApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OWMApiError';
  }
}

export class OWMHttpClient implements IWeatherClient {
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly timeoutMs: number = 5000,
    baseUrl?: string,
  ) {
    this.baseUrl = baseUrl ?? 'https://api.openweathermap.org/data/2.5';
  }

  async fetchWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    const url = `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`;

    logger.debug({ lat: latitude, lon: longitude }, 'Fetching weather from OWM');

    try {
      return await this.circuitBreaker.execute(async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const response = await fetch(url, { signal: controller.signal });

          if (!response.ok) {
            logger.error({ lat: latitude, lon: longitude, status: response.status }, 'OWM request failed');
            owmFetchTotal.inc({ status: 'error' });
            throw new OWMApiError(`OWM API responded with status ${response.status}`);
          }

          const json = await response.json();
          const parsed = OWMResponseSchema.parse(json);

          const data: WeatherData = {
            temperature: parsed.main.temp,
            humidity: parsed.main.humidity,
            pressure: parsed.main.pressure,
          };

          logger.info({ lat: latitude, lon: longitude, ...data }, 'OWM data received');
          owmFetchTotal.inc({ status: 'success' });
          return data;
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            logger.error({ lat: latitude, lon: longitude, timeoutMs: this.timeoutMs }, 'OWM request timed out');
            owmFetchTotal.inc({ status: 'timeout' });
          }
          throw error;
        } finally {
          clearTimeout(timer);
        }
      });
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        return null;
      }
      throw error;
    }
  }
}

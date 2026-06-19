import { z } from 'zod';
import { IOWMWeatherClient, OWMWeatherData } from '@/infrastructure/ports';
import { CircuitBreaker } from '@/infrastructure/fault-tolerance/CircuitBreaker';

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

export class OWMHttpClient implements IOWMWeatherClient {
  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly timeoutMs: number = 5000,
    baseUrl?: string,
  ) {
    this.baseUrl = baseUrl ?? 'https://api.openweathermap.org/data/2.5';
  }

  async fetchWeather(latitude: number, longitude: number): Promise<OWMWeatherData> {
    const url = `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`;

    return this.circuitBreaker.execute(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new OWMApiError(`OWM API responded with status ${response.status}`);
        }

        const json = await response.json();
        const parsed = OWMResponseSchema.parse(json);

        return {
          temperature: parsed.main.temp,
          humidity: parsed.main.humidity,
          pressure: parsed.main.pressure,
        };
      } finally {
        clearTimeout(timer);
      }
    });
  }
}

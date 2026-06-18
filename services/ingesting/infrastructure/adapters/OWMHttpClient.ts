import { z } from 'zod';
import { IOWMWeatherClient, OWMWeatherData } from '@/infrastructure/ports';

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
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.openweathermap.org/data/2.5',
  ) {}

  async fetchWeather(latitude: number, longitude: number): Promise<OWMWeatherData> {
    const url = `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`;

    const response = await fetch(url);

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
  }
}

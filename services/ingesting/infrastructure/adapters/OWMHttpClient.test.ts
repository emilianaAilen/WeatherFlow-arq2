import { OWMHttpClient, OWMApiError } from './OWMHttpClient';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = 'test-api-key';

const makeOWMResponse = (temp = 25.0, humidity = 60, pressure = 1013) => ({
  main: { temp, humidity, pressure },
  weather: [{ description: 'clear sky' }],
});

describe('OWMHttpClient', () => {
  let client: OWMHttpClient;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    client = new OWMHttpClient(API_KEY);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchWeather', () => {
    it('should return parsed weather data on success', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => makeOWMResponse(22.5, 55, 1015),
      } as Response);

      const result = await client.fetchWeather(-34.6037, -58.3816);

      expect(result).toEqual({ temperature: 22.5, humidity: 55, pressure: 1015 });
    });

    it('should build the correct URL with lat, lon, apiKey and units=metric', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => makeOWMResponse(),
      } as Response);

      await client.fetchWeather(10.5, 20.3);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/weather?lat=10.5&lon=20.3&appid=${API_KEY}&units=metric`,
      );
    });

    it('should use a custom baseUrl when provided', async () => {
      const customClient = new OWMHttpClient(API_KEY, 'http://localhost:9090');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => makeOWMResponse(),
      } as Response);

      await customClient.fetchWeather(0, 0);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:9090'),
      );
    });

    it('should throw OWMApiError when response is not ok', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 401 } as Response);

      await expect(client.fetchWeather(0, 0)).rejects.toThrow(OWMApiError);
      await expect(client.fetchWeather(0, 0)).rejects.toThrow('401');
    });

    it('should throw when response body does not match OWM schema', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: 'shape' }),
      } as Response);

      await expect(client.fetchWeather(0, 0)).rejects.toThrow();
    });
  });
});

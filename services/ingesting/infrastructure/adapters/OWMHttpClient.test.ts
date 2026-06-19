import { OWMHttpClient, OWMApiError } from './OWMHttpClient';
import { CircuitBreaker, CircuitOpenError } from '@/infrastructure/fault-tolerance/CircuitBreaker';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = 'test-api-key';
const TIMEOUT_MS = 5000;

const makeOWMResponse = (temp = 25.0, humidity = 60, pressure = 1013) => ({
  main: { temp, humidity, pressure },
  weather: [{ description: 'clear sky' }],
});

const makeClient = (baseUrl?: string) =>
  new OWMHttpClient(API_KEY, new CircuitBreaker({ failureThreshold: 3, successThreshold: 1, openDurationMs: 30_000 }), TIMEOUT_MS, baseUrl);

describe('OWMHttpClient', () => {
  let client: OWMHttpClient;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    client = makeClient();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('successful fetch', () => {
    it('should return parsed weather data', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => makeOWMResponse(22.5, 55, 1015),
      } as Response);

      const result = await client.fetchWeather(-34.6037, -58.3816);

      expect(result).toEqual({ temperature: 22.5, humidity: 55, pressure: 1015 });
    });

    it('should build the correct URL with lat, lon, apiKey and units=metric', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => makeOWMResponse() } as Response);

      await client.fetchWeather(10.5, 20.3);

      expect(fetchSpy).toHaveBeenCalledWith(
        `${BASE_URL}/weather?lat=10.5&lon=20.3&appid=${API_KEY}&units=metric`,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('should use a custom baseUrl when provided', async () => {
      const customClient = makeClient('http://localhost:9090');
      fetchSpy.mockResolvedValue({ ok: true, json: async () => makeOWMResponse() } as Response);

      await customClient.fetchWeather(0, 0);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:9090'),
        expect.any(Object),
      );
    });
  });

  describe('error handling', () => {
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

  describe('timeout', () => {
    it('should abort the request after timeoutMs elapses', async () => {
      jest.useFakeTimers();
      fetchSpy.mockImplementation((_url, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
      );

      const promise = client.fetchWeather(0, 0);
      jest.advanceTimersByTime(TIMEOUT_MS);

      await expect(promise).rejects.toThrow();
    });
  });

  describe('circuit breaker', () => {
    it('should open the circuit after failureThreshold consecutive failures', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 500 } as Response);

      await expect(client.fetchWeather(0, 0)).rejects.toThrow(OWMApiError);
      await expect(client.fetchWeather(0, 0)).rejects.toThrow(OWMApiError);
      await expect(client.fetchWeather(0, 0)).rejects.toThrow(OWMApiError);

      // Circuit now OPEN — fetch should not be called again
      const callCount = fetchSpy.mock.calls.length;
      await expect(client.fetchWeather(0, 0)).rejects.toThrow(CircuitOpenError);
      expect(fetchSpy.mock.calls.length).toBe(callCount);
    });

    it('should reset the circuit after a successful call following HALF_OPEN', async () => {
      jest.useFakeTimers();
      fetchSpy.mockResolvedValue({ ok: false, status: 500 } as Response);

      // Trip to OPEN
      await expect(client.fetchWeather(0, 0)).rejects.toThrow();
      await expect(client.fetchWeather(0, 0)).rejects.toThrow();
      await expect(client.fetchWeather(0, 0)).rejects.toThrow();

      // Advance past openDurationMs → HALF_OPEN on next call
      jest.advanceTimersByTime(30_001);
      fetchSpy.mockResolvedValue({ ok: true, json: async () => makeOWMResponse() } as Response);

      await expect(client.fetchWeather(0, 0)).resolves.toBeDefined();

      // Now fully CLOSED — next success works normally
      await expect(client.fetchWeather(0, 0)).resolves.toBeDefined();
    });
  });
});

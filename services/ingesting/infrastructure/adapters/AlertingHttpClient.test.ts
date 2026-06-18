import { AlertingHttpClient, AlertingApiError } from './AlertingHttpClient';

const BASE_URL = 'http://alerting:3000';

const makePayload = () => ({
  temperature: 22.5,
  humidity: 55,
  atmosphericPressure: 1015,
  stationId: 'station-uuid-1',
});

describe('AlertingHttpClient', () => {
  let client: AlertingHttpClient;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    client = new AlertingHttpClient(BASE_URL);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('postMeasurement', () => {
    it('should resolve without error on successful POST', async () => {
      fetchSpy.mockResolvedValue({ ok: true } as Response);

      await expect(client.postMeasurement(makePayload())).resolves.toBeUndefined();
    });

    it('should POST to /measurements with JSON body and correct headers', async () => {
      fetchSpy.mockResolvedValue({ ok: true } as Response);
      const payload = makePayload();

      await client.postMeasurement(payload);

      expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}/measurements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    });

    it('should throw AlertingApiError when response is not ok', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 503 } as Response);

      await expect(client.postMeasurement(makePayload())).rejects.toThrow(AlertingApiError);
      await expect(client.postMeasurement(makePayload())).rejects.toThrow('503');
    });

    it('should throw AlertingApiError on 404 (station not found in alerting)', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 404 } as Response);

      await expect(client.postMeasurement(makePayload())).rejects.toThrow(AlertingApiError);
    });
  });
});

import request from 'supertest';

const STATIONS_API_URL = process.env.STATIONS_API_URL || 'http://localhost:4010';
const ALERTING_API_URL = process.env.ALERTING_API_URL || 'http://localhost:4011';
const INGESTING_API_URL = process.env.INGESTING_API_URL || 'http://localhost:4012';

const waitFor = async <T>(
  callback: () => Promise<T>,
  timeoutMs = 15000,
  intervalMs = 500,
): Promise<T> => {
  const start = Date.now();
  while (true) {
    try {
      return await callback();
    } catch (error) {
      if (Date.now() - start > timeoutMs) throw error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
};

describe('WeatherFlow Ingestion E2E Flow', () => {
  let createdUserId: string;
  let createdStationId: string;

  it('1. should create a user in station_management', async () => {
    const res = await request(STATIONS_API_URL)
      .post('/users')
      .send({
        name: 'E2E Ingestion',
        surname: 'Tester',
        email: `e2e-ingestion-${Date.now()}@example.com`,
      });

    expect(res.status).toBe(201);
    createdUserId = res.body.id;
  });

  it('2. should create a station with receivesExternalData=true and coordinates', async () => {
    const res = await request(STATIONS_API_URL)
      .post('/weatherStations')
      .send({
        name: `E2E Ingestion Station ${Date.now()}`,
        model: 'Vantage Pro2',
        location: { latitude: -34.6037, longitude: -58.3816 },
        ownerId: createdUserId,
        receivesExternalData: true,
      });

    expect(res.status).toBe(201);
    createdStationId = res.body.id;
  });

  it('3. should register the station in the ingesting service', async () => {
    await waitFor(async () => {
      const res = await request(INGESTING_API_URL).get(`/monitored-stations/${createdStationId}`);
      expect(res.status).toBe(200);
      expect(res.body.latitude).toBe(-34.6037);
      expect(res.body.longitude).toBe(-58.3816);
    });
  });

  it('4. should ingest OWM data and create a measurement in alerting', async () => {
    await waitFor(
      async () => {
        const res = await request(ALERTING_API_URL).get('/measurements');
        expect(res.status).toBe(200);
        const measurement = res.body.find((m: any) => m.stationId === createdStationId);
        expect(measurement).toBeDefined();
        expect(measurement.temperature.value).toBe(22.5);
        expect(measurement.humidity.value).toBe(60);
        expect(measurement.atmosphericPressure.value).toBe(1013);
      },
      15000,
    );
  });
});

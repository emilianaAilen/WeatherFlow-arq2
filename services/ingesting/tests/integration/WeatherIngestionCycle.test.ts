import http from 'http';
import { AddressInfo } from 'net';
import { MongoDBContainer } from '@testcontainers/mongodb';
import { MonitoredStation } from '../../domain/entities/MonitoredStation/MonitoredStation';

describe('WeatherIngestionCycle Integration', () => {
  let mongoContainer: any;
  let owmMockServer: http.Server;
  let alertingMockServer: http.Server;

  const capturedMeasurements: any[] = [];
  let owmShouldFail = false;

  let MongoDBConnection: any;
  let MonitoredStationRepository: any;
  let service: any;

  beforeAll(async () => {
    mongoContainer = await new MongoDBContainer('mongo:6').start();
    process.env.MONGODB_URI = mongoContainer.getConnectionString() + '?directConnection=true';
    process.env.NODE_ENV = 'test';

    owmMockServer = http.createServer((_req, res) => {
      if (owmShouldFail) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ main: { temp: 22.5, humidity: 60, pressure: 1013 } }));
    });
    const owmPort = await new Promise<number>((resolve) =>
      owmMockServer.listen(0, () => resolve((owmMockServer.address() as AddressInfo).port)),
    );

    alertingMockServer = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/measurements') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          capturedMeasurements.push(JSON.parse(body));
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: 'mock-id' }));
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    const alertingPort = await new Promise<number>((resolve) =>
      alertingMockServer.listen(0, () => resolve((alertingMockServer.address() as AddressInfo).port)),
    );

    const dbModule = await import('../../infrastructure/database');
    MongoDBConnection = dbModule.MongoDBConnection;
    await MongoDBConnection.connect();

    const { MonitoredStationRepository: Repo } = await import('../../infrastructure/adapters/MonitoredStationRepository');
    const { OWMHttpClient } = await import('../../infrastructure/adapters/OWMHttpClient');
    const { AlertingHttpClient } = await import('../../infrastructure/adapters/AlertingHttpClient');
    const { WeatherIngestionService } = await import('../../application/WeatherIngestionService');
    const { CircuitBreaker } = await import('../../infrastructure/fault-tolerance/CircuitBreaker');

    MonitoredStationRepository = Repo;
    const owmCb = new CircuitBreaker({ failureThreshold: 3, successThreshold: 1, openDurationMs: 30_000 });
    const owmClient = new OWMHttpClient('test-key', owmCb, 5000, `http://localhost:${owmPort}`);
    const alertingClient = new AlertingHttpClient(`http://localhost:${alertingPort}`);
    service = new WeatherIngestionService(new Repo(), owmClient, alertingClient);
  }, 60000);

  beforeEach(async () => {
    capturedMeasurements.length = 0;
    owmShouldFail = false;
    const { MonitoredStationModel } = await import('../../infrastructure/database/schemas/MonitoredStationSchema');
    await MonitoredStationModel.deleteMany({});
  });

  afterAll(async () => {
    await MongoDBConnection?.disconnect();
    await new Promise<void>((resolve) => owmMockServer.close(() => resolve()));
    await new Promise<void>((resolve) => alertingMockServer.close(() => resolve()));
    if (mongoContainer) await mongoContainer.stop();
  });

  it('should fetch OWM data and POST to alerting for a monitored station', async () => {
    const repo = new MonitoredStationRepository();
    await repo.save(MonitoredStation.create('station-1', 'Station Norte', -34.6037, -58.3816));

    await service.runIngestionCycle();

    expect(capturedMeasurements).toHaveLength(1);
    expect(capturedMeasurements[0]).toMatchObject({
      temperature: 22.5,
      humidity: 60,
      atmosphericPressure: 1013,
      stationId: 'station-1',
    });
  });

  it('should process multiple stations sequentially in insertion order', async () => {
    const repo = new MonitoredStationRepository();
    await repo.save(MonitoredStation.create('station-1', 'Station A', -34.6037, -58.3816));
    await repo.save(MonitoredStation.create('station-2', 'Station B', 10.5, 20.3));

    await service.runIngestionCycle();

    expect(capturedMeasurements).toHaveLength(2);
    expect(capturedMeasurements[0].stationId).toBe('station-1');
    expect(capturedMeasurements[1].stationId).toBe('station-2');
  });

  it('should do nothing when there are no monitored stations', async () => {
    await service.runIngestionCycle();

    expect(capturedMeasurements).toHaveLength(0);
  });

  it('should skip a station when OWM returns an error and continue with others (bulkhead)', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const repo = new MonitoredStationRepository();
    await repo.save(MonitoredStation.create('station-1', 'Station A', 0, 0));
    await repo.save(MonitoredStation.create('station-2', 'Station B', 10.5, 20.3));

    owmShouldFail = true;
    await service.runIngestionCycle();

    expect(capturedMeasurements).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('station-1'),
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});

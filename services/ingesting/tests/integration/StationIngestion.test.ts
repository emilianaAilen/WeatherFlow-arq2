import request from 'supertest';
import { MongoDBContainer } from '@testcontainers/mongodb';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import amqplib from 'amqplib';

const STATION_ID = '550e8400-e29b-41d4-a716-446655440001';
const EXCHANGE = 'station-events';

describe('StationIngestion Integration', () => {
  let mongoContainer: any;
  let rabbitContainer: any;
  let rabbitConnection: any;
  let rabbitChannel: any;

  let app: any;
  let MongoDBConnection: any;
  let stationEventConsumer: any;

  const publishEvent = (payload: object) => {
    rabbitChannel.publish(EXCHANGE, '', Buffer.from(JSON.stringify(payload)));
  };

  const waitForProcessing = () => new Promise((resolve) => setTimeout(resolve, 500));

  beforeAll(async () => {
    mongoContainer = await new MongoDBContainer('mongo:6').start();
    rabbitContainer = await new RabbitMQContainer('rabbitmq:3-management-alpine').start();

    process.env.MONGODB_URI = mongoContainer.getConnectionString() + '?directConnection=true';
    process.env.RABBITMQ_URL = rabbitContainer.getAmqpUrl();
    process.env.NODE_ENV = 'test';

    const indexModule = await import('../../index');
    app = indexModule.app;
    const dbModule = await import('../../infrastructure/database');
    MongoDBConnection = dbModule.MongoDBConnection;
    const containerModule = await import('../../infrastructure/container');
    stationEventConsumer = containerModule.stationEventConsumer;

    await MongoDBConnection.connect();
    await stationEventConsumer.start();

    // Connect after consumer.start() so the exchange already exists
    rabbitConnection = await amqplib.connect(process.env.RABBITMQ_URL as string);
    rabbitChannel = await rabbitConnection.createChannel();
    await rabbitChannel.assertExchange(EXCHANGE, 'fanout', { durable: true });
  }, 60000);

  afterAll(async () => {
    await stationEventConsumer.stop();
    await MongoDBConnection.disconnect();

    if (rabbitChannel) await rabbitChannel.close();
    if (rabbitConnection) await rabbitConnection.close();

    if (mongoContainer) await mongoContainer.stop();
    if (rabbitContainer) await rabbitContainer.stop();
  });

  it('should register a station when StationCreated with receivesExternalData=true', async () => {
    publishEvent({
      eventType: 'StationCreated',
      id: STATION_ID,
      name: 'Station Norte',
      receivesExternalData: true,
      latitude: -34.6037,
      longitude: -58.3816,
    });

    await waitForProcessing();

    const res = await request(app.getExpressApp()).get(`/monitored-stations/${STATION_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(STATION_ID);
    expect(res.body.name).toBe('Station Norte');
    expect(res.body.latitude).toBe(-34.6037);
    expect(res.body.longitude).toBe(-58.3816);
  });

  it('should not register a station when StationCreated with receivesExternalData=false', async () => {
    const otherId = '550e8400-e29b-41d4-a716-446655440002';

    publishEvent({
      eventType: 'StationCreated',
      id: otherId,
      name: 'Station Sur',
      receivesExternalData: false,
      latitude: -31.4135,
      longitude: -64.1811,
    });

    await waitForProcessing();

    const res = await request(app.getExpressApp()).get(`/monitored-stations/${otherId}`);
    expect(res.status).toBe(404);
  });

  it('should update name and coordinates when StationUpdated for a registered station', async () => {
    publishEvent({
      eventType: 'StationUpdated',
      id: STATION_ID,
      name: 'Station Norte Actualizada',
      receivesExternalData: true,
      latitude: -34.9,
      longitude: -57.5,
    });

    await waitForProcessing();

    const res = await request(app.getExpressApp()).get(`/monitored-stations/${STATION_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Station Norte Actualizada');
    expect(res.body.latitude).toBe(-34.9);
    expect(res.body.longitude).toBe(-57.5);
  });

  it('should remove a station when StationUpdated sets receivesExternalData=false', async () => {
    publishEvent({
      eventType: 'StationUpdated',
      id: STATION_ID,
      name: 'Station Norte Actualizada',
      receivesExternalData: false,
      latitude: -34.9,
      longitude: -57.5,
    });

    await waitForProcessing();

    const res = await request(app.getExpressApp()).get(`/monitored-stations/${STATION_ID}`);
    expect(res.status).toBe(404);
  });

  it('should re-register a station when StationUpdated re-enables receivesExternalData', async () => {
    publishEvent({
      eventType: 'StationUpdated',
      id: STATION_ID,
      name: 'Station Norte Re-registrada',
      receivesExternalData: true,
      latitude: 10.5,
      longitude: 20.3,
    });

    await waitForProcessing();

    const res = await request(app.getExpressApp()).get(`/monitored-stations/${STATION_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.latitude).toBe(10.5);
    expect(res.body.longitude).toBe(20.3);
  });

  it('should remove a station when StationDeleted', async () => {
    publishEvent({ eventType: 'StationDeleted', id: STATION_ID });

    await waitForProcessing();

    const res = await request(app.getExpressApp()).get(`/monitored-stations/${STATION_ID}`);
    expect(res.status).toBe(404);
  });

  it('should send malformed event to DLQ and not register the station', async () => {
    const badId = '550e8400-e29b-41d4-a716-446655440099';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Missing latitude/longitude — Zod discriminated union will reject this
    publishEvent({
      eventType: 'StationCreated',
      id: badId,
      name: 'Bad Station',
      receivesExternalData: true,
    });

    await waitForProcessing();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error processing station event, moving to DLQ',
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();

    const res = await request(app.getExpressApp()).get(`/monitored-stations/${badId}`);
    expect(res.status).toBe(404);
  });
});

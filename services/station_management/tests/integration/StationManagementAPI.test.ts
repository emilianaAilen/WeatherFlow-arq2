import request from 'supertest';
import { MongoDBContainer } from '@testcontainers/mongodb';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import amqplib from 'amqplib';

describe('StationManagement API Integration (E2E)', () => {
  let mongoContainer: any;
  let rabbitContainer: any;
  let rabbitConnection: any;
  let rabbitChannel: any;

  let app: any;
  let MongoDBConnection: any;
  let stationEventPublisher: any;

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
    stationEventPublisher = containerModule.stationEventPublisher;

    await MongoDBConnection.connect();

    rabbitConnection = await amqplib.connect(process.env.RABBITMQ_URL as string);
    rabbitChannel = await rabbitConnection.createChannel();
  }, 60000);

  afterAll(async () => {
    if (stationEventPublisher) await stationEventPublisher.close();
    await MongoDBConnection.disconnect();

    if (rabbitChannel) await rabbitChannel.close();
    if (rabbitConnection) await rabbitConnection.close();

    if (mongoContainer) await mongoContainer.stop();
    if (rabbitContainer) await rabbitContainer.stop();
  });

  it('should create a User and a Weather Station, and publish StationCreated event', async () => {
    const queueName = 'station-events';
    await rabbitChannel.assertQueue(queueName, { durable: true });

    let receivedEvent: any = null;
    await rabbitChannel.consume(
      queueName,
      (msg: any) => {
        if (msg) {
          receivedEvent = JSON.parse(msg.content.toString());
        }
      },
      { noAck: true },
    );

    const userRes = await request(app.getExpressApp()).post('/users').send({
      email: 'test@example.com',
      name: 'E2E Tester',
      surname: 'Test',
    });

    expect(userRes.status).toBe(201);
    const userId = userRes.body.id;
    expect(userId).toBeDefined();

    const stationRes = await request(app.getExpressApp())
      .post('/weatherStations')
      .send({
        name: 'Test E2E Station',
        ownerId: userId,
        model: 'Vantage Pro2',
        location: {
          latitude: -34.6,
          longitude: -58.4,
        },
      });

    expect(stationRes.status).toBe(201);
    const stationId = stationRes.body.id;
    expect(stationId).toBeDefined();

    const getRes = await request(app.getExpressApp()).get(`/weatherStations/${stationId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Test E2E Station');

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent.eventType).toBe('StationCreated');
    expect(receivedEvent.id).toBe(stationId);
    expect(receivedEvent.name).toBe('Test E2E Station');
  });
});

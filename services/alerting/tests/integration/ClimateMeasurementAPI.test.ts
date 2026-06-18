import request from 'supertest';
import { MongoDBContainer } from '@testcontainers/mongodb';
import { RabbitMQContainer } from '@testcontainers/rabbitmq';
import amqplib from 'amqplib';

describe('ClimateMeasurement API Integration (E2E)', () => {
  let mongoContainer: any;
  let rabbitContainer: any;
  let rabbitConnection: any;
  let rabbitChannel: any;

  let app: any;
  let MongoDBConnection: any;
  let stationEventConsumer: any;
  let notificationQueue: any;

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
    notificationQueue = containerModule.notificationQueue;

    await MongoDBConnection.connect();
    await stationEventConsumer.start();

    // Connect after stationEventConsumer.start() so the exchange already exists
    rabbitConnection = await amqplib.connect(process.env.RABBITMQ_URL as string);
    rabbitChannel = await rabbitConnection.createChannel();
    await rabbitChannel.assertExchange('station-events', 'fanout', { durable: true });
  }, 60000);

  afterAll(async () => {
    await stationEventConsumer.stop();
    if (notificationQueue) await notificationQueue.close();
    await MongoDBConnection.disconnect();

    if (rabbitChannel) await rabbitChannel.close();
    if (rabbitConnection) await rabbitConnection.close();

    if (mongoContainer) await mongoContainer.stop();
    if (rabbitContainer) await rabbitContainer.stop();
  });

  it('should process a StationCreated event and allow creating a measurement for it', async () => {
    const stationId = '550e8400-e29b-41d4-a716-446655440000';
    const event = {
      eventType: 'StationCreated',
      id: stationId,
      name: 'E2E Test Station',
    };

    rabbitChannel.publish('station-events', '', Buffer.from(JSON.stringify(event)));

    await new Promise((resolve) => setTimeout(resolve, 500));

    const response = await request(app.getExpressApp()).post('/measurements').send({
      temperature: 25.5,
      humidity: 60,
      atmosphericPressure: 1013,
      stationId: stationId,
    });

    expect(response.status).toBe(201);
    expect(response.body.temperature.value).toBe(25.5);
    expect(response.body.alert.status).toBe(false);
    expect(response.body.stationId).toBe(stationId);
  });

  it('should return 404 when trying to create a measurement for a non-existent station', async () => {
    const response = await request(app.getExpressApp()).post('/measurements').send({
      temperature: 20.0,
      humidity: 50,
      atmosphericPressure: 1010,
      stationId: '00000000-0000-0000-0000-000000000000',
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 when creating a measurement with invalid data', async () => {
    const response = await request(app.getExpressApp()).post('/measurements').send({
      temperature: 'invalid',
      stationId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(response.status).toBe(400);
  });

  it('should create an extreme measurement and publish an alert notification', async () => {
    const stationId = '550e8400-e29b-41d4-a716-446655440000';

    await rabbitChannel.assertQueue('climate-alerts', { durable: true });

    let receivedNotification: any = null;
    await rabbitChannel.consume(
      'climate-alerts',
      (msg: any) => {
        if (msg) {
          receivedNotification = JSON.parse(msg.content.toString());
        }
      },
      { noAck: true },
    );

    const response = await request(app.getExpressApp()).post('/measurements').send({
      temperature: 55.0,
      humidity: 10,
      atmosphericPressure: 900,
      stationId: stationId,
    });

    expect(response.status).toBe(201);
    expect(response.body.alert.status).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(receivedNotification).not.toBeNull();
    expect(receivedNotification.stationId).toBe(stationId);
    expect(receivedNotification.alertType).toBeDefined();
  });

  it('should allow searching, retrieving, updating and deleting measurements', async () => {
    const stationId = '550e8400-e29b-41d4-a716-446655440000';

    const createRes = await request(app.getExpressApp()).post('/measurements').send({
      temperature: 15.0,
      humidity: 45,
      atmosphericPressure: 1005,
      stationId: stationId,
    });

    const measurementId = createRes.body.id;
    expect(measurementId).toBeDefined();

    const searchRes = await request(app.getExpressApp()).get(
      `/measurements?min_temperature=10&max_temperature=20&min_humidity=40`,
    );

    expect(searchRes.status).toBe(200);
    expect(Array.isArray(searchRes.body)).toBe(true);
    expect(searchRes.body.some((m: any) => m.id === measurementId)).toBe(true);

    const getRes = await request(app.getExpressApp()).get(`/measurements/${measurementId}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(measurementId);

    const patchRes = await request(app.getExpressApp())
      .patch(`/measurements/${measurementId}`)
      .send({
        temperature: 16.0,
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.temperature.value).toBe(16.0);

    const deleteRes = await request(app.getExpressApp()).delete(`/measurements/${measurementId}`);

    expect(deleteRes.status).toBe(204);

    const getDeletedRes = await request(app.getExpressApp()).get(`/measurements/${measurementId}`);

    expect(getDeletedRes.status).toBe(404);
  });
});

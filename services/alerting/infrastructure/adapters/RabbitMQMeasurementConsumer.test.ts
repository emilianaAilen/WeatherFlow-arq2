import { RabbitMQMeasurementConsumer } from './RabbitMQMeasurementConsumer';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import amqplib from 'amqplib';

jest.mock('amqplib');

describe('RabbitMQMeasurementConsumer', () => {
  let measurementService: jest.Mocked<ClimateMeasurementPort>;
  let consumer: RabbitMQMeasurementConsumer;
  let mockChannel: any;

  const validPayload = {
    temperature: 22.5,
    humidity: 60,
    atmosphericPressure: 1013,
    stationId: 'station-1',
  };

  beforeEach(() => {
    measurementService = {
      createMeasurement: jest.fn(),
      updateMeasurement: jest.fn(),
      getMeasurementById: jest.fn(),
      deleteMeasurement: jest.fn(),
      search: jest.fn(),
      getCurrentMeasurementByStationId: jest.fn(),
      getDailyAverageByStationId: jest.fn(),
      getWeeklyTemperatureAverageByStationId: jest.fn(),
    };

    mockChannel = {
      assertQueue: jest.fn(),
      assertExchange: jest.fn(),
      bindQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
    };

    const mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn(),
      on: jest.fn(),
    };

    (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

    consumer = new RabbitMQMeasurementConsumer('amqp://localhost', measurementService);
  });

  afterEach(() => jest.clearAllMocks());

  const getConsumeCallback = () => mockChannel.consume.mock.calls[0][1];
  const makeMessage = (payload: object) => ({ content: Buffer.from(JSON.stringify(payload)) });

  it('should call createMeasurement and ack on valid payload', async () => {
    (measurementService.createMeasurement as jest.Mock).mockResolvedValue({});
    await consumer.start();

    await getConsumeCallback()(makeMessage(validPayload));

    expect(measurementService.createMeasurement).toHaveBeenCalledWith(validPayload);
    expect(mockChannel.ack).toHaveBeenCalled();
  });

  it('should nack to DLQ when station is not found', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const { NotFoundError } = await import('@/domain/errors/DomainErrors');
    (measurementService.createMeasurement as jest.Mock).mockRejectedValue(
      new NotFoundError('Weather station not found'),
    );

    await consumer.start();
    await getConsumeCallback()(makeMessage(validPayload));

    expect(mockChannel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
    consoleErrorSpy.mockRestore();
  });

  it('should nack to DLQ on invalid payload schema', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    await consumer.start();

    await getConsumeCallback()(makeMessage({ invalid: 'payload' }));

    expect(mockChannel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
    expect(measurementService.createMeasurement).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle null message gracefully', async () => {
    await consumer.start();
    await getConsumeCallback()(null);

    expect(mockChannel.ack).not.toHaveBeenCalled();
    expect(mockChannel.nack).not.toHaveBeenCalled();
  });

  it('should bind to ingested-measurements exchange', async () => {
    await consumer.start();

    expect(mockChannel.assertExchange).toHaveBeenCalledWith(
      'ingested-measurements', 'fanout', { durable: true },
    );
    expect(mockChannel.assertQueue).toHaveBeenCalledWith(
      'alerting.ingested-measurements',
      expect.objectContaining({ durable: true }),
    );
    expect(mockChannel.bindQueue).toHaveBeenCalledWith(
      'alerting.ingested-measurements', 'ingested-measurements', '',
    );
  });
});

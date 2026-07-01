import { RabbitMQMeasurementPublisher } from './RabbitMQMeasurementPublisher';
import amqplib from 'amqplib';

jest.mock('amqplib');

describe('RabbitMQMeasurementPublisher', () => {
  let publisher: RabbitMQMeasurementPublisher;
  let mockChannel: any;

  const message = {
    temperature: 22.5,
    humidity: 60,
    atmosphericPressure: 1013,
    stationId: 'station-1',
  };

  beforeEach(() => {
    mockChannel = {
      assertExchange: jest.fn(),
      publish: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
    };

    const mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn(),
      on: jest.fn(),
    };

    (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

    publisher = new RabbitMQMeasurementPublisher('amqp://localhost');
  });

  afterEach(() => jest.clearAllMocks());

  it('should publish message to ingested-measurements fanout exchange', async () => {
    await publisher.publish(message);

    expect(mockChannel.publish).toHaveBeenCalledWith(
      'ingested-measurements',
      '',
      expect.any(Buffer),
      expect.objectContaining({ persistent: true }),
    );
  });

  it('should publish the correct JSON payload', async () => {
    await publisher.publish(message);

    const publishedBuffer: Buffer = mockChannel.publish.mock.calls[0][2];
    const payload = JSON.parse(publishedBuffer.toString());

    expect(payload).toEqual(message);
  });

  it('should reuse the same channel across multiple publishes', async () => {
    await publisher.publish(message);
    await publisher.publish(message);

    expect(amqplib.connect).toHaveBeenCalledTimes(1);
    expect(mockChannel.assertExchange).toHaveBeenCalledTimes(1);
  });
});

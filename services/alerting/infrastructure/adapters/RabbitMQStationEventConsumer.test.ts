import { RabbitMQStationEventConsumer } from './RabbitMQStationEventConsumer';
import { IStationReadModelRepository } from '@/infrastructure/ports/IStationReadModelRepository';
import amqplib from 'amqplib';

jest.mock('amqplib');

describe('RabbitMQStationEventConsumer', () => {
  let stationReadModelRepository: jest.Mocked<IStationReadModelRepository>;
  let consumer: RabbitMQStationEventConsumer;
  let mockChannel: any;

  beforeEach(() => {
    stationReadModelRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockChannel = {
      assertQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn(),
    };

    const mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn(),
    };

    (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

    consumer = new RabbitMQStationEventConsumer('amqp://localhost', stationReadModelRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save station on StationCreated event', async () => {
    await consumer.start();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];

    const message = {
      content: Buffer.from(
        JSON.stringify({
          eventType: 'StationCreated',
          id: 'station-1',
          name: 'Station One',
        })
      ),
    };

    await consumeCallback(message);

    expect(stationReadModelRepository.save).toHaveBeenCalledWith({
      id: 'station-1',
      name: 'Station One',
    });
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
  });

  it('should update station on StationUpdated event', async () => {
    await consumer.start();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];

    const message = {
      content: Buffer.from(
        JSON.stringify({
          eventType: 'StationUpdated',
          id: 'station-1',
          name: 'Station One Updated',
        })
      ),
    };

    await consumeCallback(message);

    expect(stationReadModelRepository.update).toHaveBeenCalledWith('station-1', 'Station One Updated');
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
  });

  it('should remove station on StationDeleted event', async () => {
    await consumer.start();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];

    const message = {
      content: Buffer.from(
        JSON.stringify({
          eventType: 'StationDeleted',
          id: 'station-1',
        })
      ),
    };

    await consumeCallback(message);

    expect(stationReadModelRepository.remove).toHaveBeenCalledWith('station-1');
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
  });

  it('should warn and ack on unknown event type', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    await consumer.start();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    const message = {
      content: Buffer.from(JSON.stringify({ eventType: 'UnknownEvent', id: '1' })),
    };

    await consumeCallback(message);

    expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown event type: UnknownEvent');
    expect(mockChannel.ack).toHaveBeenCalledWith(message);
    consoleWarnSpy.mockRestore();
  });

  it('should handle missing message gracefully', async () => {
    await consumer.start();
    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    
    await consumeCallback(null);
    expect(mockChannel.ack).not.toHaveBeenCalled();
  });

  it('should catch error, log it, and nack message', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    await consumer.start();

    const consumeCallback = mockChannel.consume.mock.calls[0][1];
    const message = {
      content: Buffer.from(JSON.stringify({ eventType: 'StationCreated', id: '1' })),
    };

    stationReadModelRepository.save.mockRejectedValue(new Error('DB Error'));

    await consumeCallback(message);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing station event', expect.any(Error));
    expect(mockChannel.nack).toHaveBeenCalledWith(message, false, false);
    consoleErrorSpy.mockRestore();
  });

  it('should close channel and connection on stop', async () => {
    await consumer.start();
    await consumer.stop();
    
    expect(mockChannel.close).toHaveBeenCalled();
  });
});

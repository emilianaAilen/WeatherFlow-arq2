import { RabbitMQStationEventConsumer } from './RabbitMQStationEventConsumer';
import { IMonitoredStationRepository } from '@/infrastructure/ports';
import amqplib from 'amqplib';

jest.mock('amqplib');

describe('RabbitMQStationEventConsumer', () => {
  let monitoredStationRepository: jest.Mocked<IMonitoredStationRepository>;
  let consumer: RabbitMQStationEventConsumer;
  let mockChannel: any;

  beforeEach(() => {
    monitoredStationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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

    consumer = new RabbitMQStationEventConsumer('amqp://localhost', monitoredStationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getConsumeCallback = () => mockChannel.consume.mock.calls[0][1];

  const makeMessage = (payload: object) => ({
    content: Buffer.from(JSON.stringify(payload)),
  });

  describe('StationCreated', () => {
    it('should save station when receivesExternalData is true', async () => {
      await consumer.start();
      const callback = getConsumeCallback();

      const message = makeMessage({
        eventType: 'StationCreated',
        id: 'station-1',
        name: 'Station Norte',
        receivesExternalData: true,
        latitude: -34.6037,
        longitude: -58.3816,
      });

      await callback(message);

      expect(monitoredStationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'station-1',
          name: 'Station Norte',
          latitude: -34.6037,
          longitude: -58.3816,
        }),
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(message);
    });

    it('should not save station when receivesExternalData is false', async () => {
      await consumer.start();
      const callback = getConsumeCallback();

      await callback(
        makeMessage({
          eventType: 'StationCreated',
          id: 'station-1',
          name: 'Station Norte',
          receivesExternalData: false,
          latitude: -34.6037,
          longitude: -58.3816,
        }),
      );

      expect(monitoredStationRepository.save).not.toHaveBeenCalled();
    });

    it('should nack when coordinates are missing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      await consumer.start();
      const callback = getConsumeCallback();

      await callback(
        makeMessage({
          eventType: 'StationCreated',
          id: 'station-1',
          name: 'Station Norte',
          receivesExternalData: true,
          // latitude and longitude missing
        }),
      );

      expect(mockChannel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
      expect(monitoredStationRepository.save).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('StationUpdated', () => {
    it('should update station when it exists and receivesExternalData is true', async () => {
      monitoredStationRepository.findById.mockResolvedValue({
        id: 'station-1',
        name: 'Old Name',
        alertingStationId: 'station-1',
        latitude: 0,
        longitude: 0,
      } as any);

      await consumer.start();
      const callback = getConsumeCallback();

      await callback(
        makeMessage({
          eventType: 'StationUpdated',
          id: 'station-1',
          name: 'New Name',
          receivesExternalData: true,
          latitude: 10.5,
          longitude: 20.3,
        }),
      );

      expect(monitoredStationRepository.update).toHaveBeenCalledWith('station-1', 'New Name', 10.5, 20.3);
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should save station when it does not exist and receivesExternalData is true', async () => {
      monitoredStationRepository.findById.mockResolvedValue(null);

      await consumer.start();
      const callback = getConsumeCallback();

      await callback(
        makeMessage({
          eventType: 'StationUpdated',
          id: 'station-1',
          name: 'Station Norte',
          receivesExternalData: true,
          latitude: 10.5,
          longitude: 20.3,
        }),
      );

      expect(monitoredStationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'station-1', latitude: 10.5, longitude: 20.3 }),
      );
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should remove station when receivesExternalData becomes false', async () => {
      monitoredStationRepository.findById.mockResolvedValue({
        id: 'station-1',
        name: 'Station Norte',
        alertingStationId: 'station-1',
        latitude: 0,
        longitude: 0,
      } as any);

      await consumer.start();
      const callback = getConsumeCallback();

      await callback(
        makeMessage({
          eventType: 'StationUpdated',
          id: 'station-1',
          name: 'Station Norte',
          receivesExternalData: false,
          latitude: 10.5,
          longitude: 20.3,
        }),
      );

      expect(monitoredStationRepository.remove).toHaveBeenCalledWith('station-1');
      expect(mockChannel.ack).toHaveBeenCalled();
    });
  });

  describe('StationDeleted', () => {
    it('should always remove the station', async () => {
      await consumer.start();
      const callback = getConsumeCallback();

      await callback(makeMessage({ eventType: 'StationDeleted', id: 'station-1' }));

      expect(monitoredStationRepository.remove).toHaveBeenCalledWith('station-1');
      expect(mockChannel.ack).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should nack on unknown eventType', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      await consumer.start();
      const callback = getConsumeCallback();

      await callback(makeMessage({ eventType: 'UnknownEvent', id: 'station-1' }));

      expect(mockChannel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
      consoleErrorSpy.mockRestore();
    });

    it('should nack on invalid JSON', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      await consumer.start();
      const callback = getConsumeCallback();

      const message = { content: Buffer.from('not-valid-json') };
      await callback(message);

      expect(mockChannel.nack).toHaveBeenCalledWith(message, false, false);
      consoleErrorSpy.mockRestore();
    });

    it('should nack when repository throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      monitoredStationRepository.remove.mockRejectedValue(new Error('DB Error'));

      await consumer.start();
      const callback = getConsumeCallback();

      await callback(makeMessage({ eventType: 'StationDeleted', id: 'station-1' }));

      expect(mockChannel.nack).toHaveBeenCalledWith(expect.anything(), false, false);
      consoleErrorSpy.mockRestore();
    });

    it('should handle null message gracefully', async () => {
      await consumer.start();
      const callback = getConsumeCallback();

      await callback(null);

      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });
  });

  it('should close channel and connection on stop', async () => {
    await consumer.start();
    await consumer.stop();

    expect(mockChannel.close).toHaveBeenCalled();
  });
});

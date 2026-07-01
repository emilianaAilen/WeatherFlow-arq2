import { RabbitMQStationEventPublisher } from './RabbitMQStationEventPublisher';
import { WeatherStation, Location } from '@/domain';
import { StationStatusType } from '@/domain/types';
import amqplib from 'amqplib';

jest.mock('amqplib');

describe('RabbitMQStationEventPublisher', () => {
  let publisher: RabbitMQStationEventPublisher;
  let mockChannel: any;

  const makeStation = (overrides: Partial<{ lat: number; lon: number; receivesExternalData: boolean }> = {}) =>
    WeatherStation.create(
      'station-1',
      'Station Norte',
      Location.create(overrides.lat ?? -34.6037, overrides.lon ?? -58.3816),
      'Vantage Pro2',
      StationStatusType.ACTIVE,
      'owner-1',
      overrides.receivesExternalData ?? true,
    );

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

    publisher = new RabbitMQStationEventPublisher('amqp://localhost');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getPublishedPayload = () => {
    const rawBuffer: Buffer = mockChannel.publish.mock.calls[0][2];
    return JSON.parse(rawBuffer.toString());
  };

  describe('publishStationCreated', () => {
    it('should publish eventType, id, name, receivesExternalData, latitude and longitude', async () => {
      const station = makeStation({ lat: -34.6037, lon: -58.3816, receivesExternalData: true });

      await publisher.publishStationCreated(station);

      const payload = getPublishedPayload();
      expect(payload).toEqual({
        eventType: 'StationCreated',
        id: 'station-1',
        name: 'Station Norte',
        receivesExternalData: true,
        latitude: -34.6037,
        longitude: -58.3816,
      });
    });

    it('should publish to the station-events exchange', async () => {
      await publisher.publishStationCreated(makeStation());

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'station-events',
        '',
        expect.any(Buffer),
        expect.objectContaining({ persistent: true }),
      );
    });
  });

  describe('publishStationUpdated', () => {
    it('should publish eventType, id, name, receivesExternalData, latitude and longitude', async () => {
      const station = makeStation({ lat: 10.5, lon: 20.3, receivesExternalData: false });

      await publisher.publishStationUpdated(station);

      const payload = getPublishedPayload();
      expect(payload).toEqual({
        eventType: 'StationUpdated',
        id: 'station-1',
        name: 'Station Norte',
        receivesExternalData: false,
        latitude: 10.5,
        longitude: 20.3,
      });
    });
  });

  describe('publishStationDeleted', () => {
    it('should publish only eventType and id (no coordinates)', async () => {
      await publisher.publishStationDeleted('station-1');

      const payload = getPublishedPayload();
      expect(payload).toEqual({
        eventType: 'StationDeleted',
        id: 'station-1',
      });
      expect(payload.latitude).toBeUndefined();
      expect(payload.longitude).toBeUndefined();
    });
  });

  describe('close', () => {
    it('should close channel and connection', async () => {
      await publisher.publishStationCreated(makeStation());
      await publisher.close();

      expect(mockChannel.close).toHaveBeenCalled();
    });
  });
});

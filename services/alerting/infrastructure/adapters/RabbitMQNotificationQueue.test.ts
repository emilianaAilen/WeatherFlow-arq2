import { RabbitMQNotificationQueue } from './RabbitMQNotificationQueue';
import { ClimateMeasurement } from '@/domain';
import { alertsTriggeredTotal } from '@/infrastructure/telemetry/metrics';
import amqplib from 'amqplib';

jest.mock('amqplib');

describe('RabbitMQNotificationQueue', () => {
  let queue: RabbitMQNotificationQueue;
  let mockChannel: any;
  let incSpy: jest.SpyInstance;

  const makeAlertMeasurement = () =>
    ClimateMeasurement.create('meas-1', 50, 60, 1013, new Date('2024-01-01T00:00:00Z'), 'station-1');

  beforeEach(() => {
    mockChannel = {
      assertQueue: jest.fn(),
      sendToQueue: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
    };

    const mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn(),
      on: jest.fn(),
    };

    (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

    queue = new RabbitMQNotificationQueue('amqp://localhost');
    incSpy = jest.spyOn(alertsTriggeredTotal, 'inc').mockImplementation(() => alertsTriggeredTotal);
  });

  afterEach(() => jest.clearAllMocks());

  describe('publish', () => {
    it('should send to the climate-alerts queue', async () => {
      await queue.publish(makeAlertMeasurement());

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'climate-alerts',
        expect.any(Buffer),
        expect.objectContaining({ persistent: true }),
      );
    });

    it('should publish the correct payload fields', async () => {
      const measurement = makeAlertMeasurement();

      await queue.publish(measurement);

      const rawBuffer: Buffer = mockChannel.sendToQueue.mock.calls[0][1];
      const payload = JSON.parse(rawBuffer.toString());

      expect(payload).toMatchObject({
        measurementId: 'meas-1',
        stationId: 'station-1',
        temperature: 50,
        humidity: 60,
        atmosphericPressure: 1013,
      });
      expect(payload.alertType).toBeDefined();
      expect(payload.dateTime).toBeDefined();
    });

    it('should assert the climate-alerts queue as durable', async () => {
      await queue.publish(makeAlertMeasurement());

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'climate-alerts',
        { durable: true },
      );
    });

    it('should increment alertsTriggeredTotal with the alert type', async () => {
      const measurement = makeAlertMeasurement();

      await queue.publish(measurement);

      expect(incSpy).toHaveBeenCalledWith({ alert_type: measurement.alert.getType() });
    });

    it('should include trace headers in sendToQueue options', async () => {
      await queue.publish(makeAlertMeasurement());

      const options = mockChannel.sendToQueue.mock.calls[0][2];
      expect(options).toHaveProperty('headers');
      expect(typeof options.headers).toBe('object');
    });
  });

  describe('close', () => {
    it('should close channel and connection', async () => {
      await queue.publish(makeAlertMeasurement());
      await queue.close();

      expect(mockChannel.close).toHaveBeenCalled();
    });
  });
});

import amqplib, { Channel, ChannelModel } from 'amqplib';
import { WeatherStation } from '@/domain';
import { IStationEventPublisher } from '@/infrastructure/ports';
import { logger } from '@/infrastructure/logger';
import { stationEventsPublishedTotal } from '@/infrastructure/telemetry/metrics';
import { injectTraceHeaders } from '@/infrastructure/telemetry/amqpPropagation';

const EXCHANGE = 'station-events';

export class RabbitMQStationEventPublisher implements IStationEventPublisher {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly url: string) {}

  private async getChannel(): Promise<Channel> {
    if (this.channel) return this.channel;

    try {
      if (!this.model) {
        this.model = await amqplib.connect(this.url);
        this.model.on('error', (err) => {
          logger.error({ err }, 'RabbitMQ connection error');
          this.model = null;
          this.channel = null;
        });
        this.model.on('close', () => {
          logger.info('RabbitMQ connection closed');
          this.model = null;
          this.channel = null;
        });
      }

      this.channel = await this.model.createChannel();
      this.channel.on('error', (err) => {
        logger.error({ err }, 'RabbitMQ channel error');
        this.channel = null;
      });
      this.channel.on('close', () => {
        logger.info('RabbitMQ channel closed');
        this.channel = null;
      });

      await this.channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
      return this.channel;
    } catch (error) {
      this.model = null;
      this.channel = null;
      throw error;
    }
  }

  async publishStationCreated(station: WeatherStation): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationCreated',
        id: station.id,
        name: station.getName(),
        receivesExternalData: station.getReceivesExternalData(),
        latitude: station.getLocation().getLatitude(),
        longitude: station.getLocation().getLongitude(),
      }),
    );
    channel.publish(EXCHANGE, '', payload, { persistent: true, headers: injectTraceHeaders() });
    stationEventsPublishedTotal.inc({ event_type: 'StationCreated' });
    logger.info({ stationId: station.id, eventType: 'StationCreated' }, 'Station event published');
  }

  async publishStationUpdated(station: WeatherStation): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationUpdated',
        id: station.id,
        name: station.getName(),
        receivesExternalData: station.getReceivesExternalData(),
        latitude: station.getLocation().getLatitude(),
        longitude: station.getLocation().getLongitude(),
      }),
    );
    channel.publish(EXCHANGE, '', payload, { persistent: true, headers: injectTraceHeaders() });
    stationEventsPublishedTotal.inc({ event_type: 'StationUpdated' });
    logger.info({ stationId: station.id, eventType: 'StationUpdated' }, 'Station event published');
  }

  async publishStationDeleted(stationId: string): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationDeleted',
        id: stationId,
      }),
    );
    channel.publish(EXCHANGE, '', payload, { persistent: true, headers: injectTraceHeaders() });
    stationEventsPublishedTotal.inc({ event_type: 'StationDeleted' });
    logger.info({ stationId, eventType: 'StationDeleted' }, 'Station event published');
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.model) await this.model.close();
  }
}

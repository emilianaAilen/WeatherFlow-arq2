import amqplib, { Channel, ChannelModel } from 'amqplib';
import { WeatherStation } from '@/domain';
import { IStationEventPublisher } from '@/infrastructure/ports';

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
          console.error('RabbitMQ connection error', err);
          this.model = null;
          this.channel = null;
        });
        this.model.on('close', () => {
          console.info('RabbitMQ connection closed');
          this.model = null;
          this.channel = null;
        });
      }

      this.channel = await this.model.createChannel();
      this.channel.on('error', (err) => {
        console.error('RabbitMQ channel error', err);
        this.channel = null;
      });
      this.channel.on('close', () => {
        console.info('RabbitMQ channel closed');
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
      }),
    );
    channel.publish(EXCHANGE, '', payload, { persistent: true });
  }

  async publishStationUpdated(station: WeatherStation): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationUpdated',
        id: station.id,
        name: station.getName(),
        receivesExternalData: station.getReceivesExternalData(),
      }),
    );
    channel.publish(EXCHANGE, '', payload, { persistent: true });
  }

  async publishStationDeleted(stationId: string): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationDeleted',
        id: stationId,
      }),
    );
    channel.publish(EXCHANGE, '', payload, { persistent: true });
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.model) await this.model.close();
  }
}

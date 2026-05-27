import amqplib, { Channel, ChannelModel } from 'amqplib';
import { WeatherStation } from '@/domain';
import { IStationEventPublisher } from '@/infrastructure/ports';

const QUEUE = 'station-events';

export class RabbitMQStationEventPublisher implements IStationEventPublisher {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly url: string) {}

  private async getChannel(): Promise<Channel> {
    if (this.channel) return this.channel;
    this.model = await amqplib.connect(this.url);
    this.channel = await this.model.createChannel();
    await this.channel.assertQueue(QUEUE, { durable: true });
    return this.channel;
  }

  async publishStationCreated(station: WeatherStation): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationCreated',
        id: station.id,
        name: station.getName(),
      })
    );
    channel.sendToQueue(QUEUE, payload, { persistent: true });
  }

  async publishStationUpdated(station: WeatherStation): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationUpdated',
        id: station.id,
        name: station.getName(),
      })
    );
    channel.sendToQueue(QUEUE, payload, { persistent: true });
  }

  async publishStationDeleted(stationId: string): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        eventType: 'StationDeleted',
        id: stationId,
      })
    );
    channel.sendToQueue(QUEUE, payload, { persistent: true });
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.model) await this.model.close();
  }
}

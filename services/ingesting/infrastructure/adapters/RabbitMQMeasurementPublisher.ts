import amqplib, { Channel, ChannelModel } from 'amqplib';
import { IMeasurementPublisher, MeasurementMessage } from '@/infrastructure/ports';

const EXCHANGE = 'ingested-measurements';

export class RabbitMQMeasurementPublisher implements IMeasurementPublisher {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(private readonly url: string) {}

  private async getChannel(): Promise<Channel> {
    if (this.channel) return this.channel;

    try {
      if (!this.model) {
        this.model = await amqplib.connect(this.url);
        this.model.on('error', (err) => {
          console.error('RabbitMQ measurement publisher connection error', err);
          this.model = null;
          this.channel = null;
        });
        this.model.on('close', () => {
          console.info('RabbitMQ measurement publisher connection closed');
          this.model = null;
          this.channel = null;
        });
      }

      this.channel = await this.model.createChannel();
      this.channel.on('error', (err) => {
        console.error('RabbitMQ measurement publisher channel error', err);
        this.channel = null;
      });
      this.channel.on('close', () => {
        console.info('RabbitMQ measurement publisher channel closed');
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

  async publish(message: MeasurementMessage): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(JSON.stringify(message));
    channel.publish(EXCHANGE, '', payload, { persistent: true });
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.model) await this.model.close();
  }
}

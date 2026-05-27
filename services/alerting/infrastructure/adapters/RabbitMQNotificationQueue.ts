import amqplib, { Channel, ChannelModel } from 'amqplib';
import { ClimateMeasurement } from '@/domain';
import { INotificationQueue } from '@/infrastructure/ports';

const QUEUE = 'climate-alerts';

export class RabbitMQNotificationQueue implements INotificationQueue {
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

      await this.channel.assertQueue(QUEUE, { durable: true });
      return this.channel;
    } catch (error) {
      this.model = null;
      this.channel = null;
      throw error;
    }
  }

  async publish(measurement: ClimateMeasurement): Promise<void> {
    const channel = await this.getChannel();
    const payload = Buffer.from(
      JSON.stringify({
        measurementId: measurement.id,
        stationId: measurement.stationId,
        alertType: measurement.alert.getType(),
        temperature: measurement.temperature.value,
        humidity: measurement.humidity.value,
        atmosphericPressure: measurement.atmosphericPressure.value,
        dateTime: measurement.dateTime,
      }),
    );
    channel.sendToQueue(QUEUE, payload, { persistent: true });
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.model) await this.model.close();
  }
}

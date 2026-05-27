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
    this.model = await amqplib.connect(this.url);
    this.channel = await this.model.createChannel();
    await this.channel.assertQueue(QUEUE, { durable: true });
    return this.channel;
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

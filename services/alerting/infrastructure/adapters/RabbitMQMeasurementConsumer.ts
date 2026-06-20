import amqplib, { Channel, ChannelModel } from 'amqplib';
import { z } from 'zod';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';

const EXCHANGE = 'ingested-measurements';
const QUEUE = 'alerting.ingested-measurements';
const DLX_EXCHANGE = 'alerting.ingested-measurements-dlx';
const DLQ = 'alerting.ingested-measurements-dlq';

const MeasurementPayloadSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  atmosphericPressure: z.number(),
  stationId: z.string(),
});

export class RabbitMQMeasurementConsumer {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;
  private reconnecting = false;

  constructor(
    private readonly url: string,
    private readonly measurementService: ClimateMeasurementPort,
  ) {}

  async start(): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;

    try {
      this.model = await amqplib.connect(this.url);

      this.model.on('error', (err) => {
        console.error('RabbitMQ measurement consumer connection error', err);
        this.reconnect();
      });

      this.model.on('close', () => {
        console.info('RabbitMQ measurement consumer connection closed');
        this.reconnect();
      });

      this.channel = await this.model.createChannel();

      this.channel.on('error', (err) => {
        console.error('RabbitMQ measurement consumer channel error', err);
        this.reconnect();
      });

      this.channel.on('close', () => {
        console.info('RabbitMQ measurement consumer channel closed');
        this.reconnect();
      });

      await this.channel.assertExchange(EXCHANGE, 'fanout', { durable: true });

      await this.channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });
      await this.channel.assertQueue(DLQ, { durable: true });
      await this.channel.bindQueue(DLQ, DLX_EXCHANGE, '');

      await this.channel.assertQueue(QUEUE, {
        durable: true,
        deadLetterExchange: DLX_EXCHANGE,
      });
      await this.channel.bindQueue(QUEUE, EXCHANGE, '');

      this.channel.consume(QUEUE, async (msg) => {
        if (!msg) return;

        try {
          const rawPayload = JSON.parse(msg.content.toString());
          const payload = MeasurementPayloadSchema.parse(rawPayload);

          await this.measurementService.createMeasurement(payload);
          console.info(`Measurement created for station ${payload.stationId}`);

          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error processing ingested measurement, moving to DLQ', error);
          this.channel?.nack(msg, false, false);
        }
      });

      console.info('RabbitMQ MeasurementConsumer (alerting) started successfully');
    } catch (error) {
      console.error('Failed to start measurement consumer:', error);
      this.reconnect();
    } finally {
      this.reconnecting = false;
    }
  }

  private reconnect(): void {
    if (this.reconnecting) return;
    this.model = null;
    this.channel = null;
    console.info('Attempting to reconnect measurement consumer in 5 seconds...');
    setTimeout(() => {
      this.start().catch(console.error);
    }, 5000);
  }

  async stop(): Promise<void> {
    this.reconnecting = true;
    await this.channel?.close();
    await this.model?.close();
  }
}

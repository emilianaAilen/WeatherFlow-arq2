import amqplib, { Channel, ChannelModel } from 'amqplib';
import { z } from 'zod';
import { IStationReadModelRepository } from '@/infrastructure/ports/IStationReadModelRepository';

const QUEUE = 'station-events';
const DLX_EXCHANGE = 'station-events-dlx';
const DLQ = 'station-events-dlq';

const EventPayloadSchema = z.object({
  eventType: z.enum(['StationCreated', 'StationUpdated', 'StationDeleted']),
  id: z.string(),
  name: z.string().optional(),
});

export class RabbitMQStationEventConsumer {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;
  private reconnecting = false;

  constructor(
    private readonly url: string,
    private readonly stationReadModelRepository: IStationReadModelRepository,
  ) {}

  async start(): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;

    try {
      this.model = await amqplib.connect(this.url);

      this.model.on('error', (err) => {
        console.error('RabbitMQ consumer connection error', err);
        this.reconnect();
      });

      this.model.on('close', () => {
        console.info('RabbitMQ consumer connection closed');
        this.reconnect();
      });

      this.channel = await this.model.createChannel();

      this.channel.on('error', (err) => {
        console.error('RabbitMQ consumer channel error', err);
        this.reconnect();
      });

      this.channel.on('close', () => {
        console.info('RabbitMQ consumer channel closed');
        this.reconnect();
      });

      // Assert DLX and DLQ
      await this.channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });
      await this.channel.assertQueue(DLQ, { durable: true });
      await this.channel.bindQueue(DLQ, DLX_EXCHANGE, '');

      // Assert Main Queue with DLX configuration
      await this.channel.assertQueue(QUEUE, {
        durable: true,
        deadLetterExchange: DLX_EXCHANGE,
      });

      this.channel.consume(QUEUE, async (msg) => {
        if (!msg) return;

        try {
          const rawPayload = JSON.parse(msg.content.toString());
          const payload = EventPayloadSchema.parse(rawPayload);

          switch (payload.eventType) {
            case 'StationCreated':
              if (!payload.name) throw new Error('Name required for StationCreated');
              await this.stationReadModelRepository.save({
                id: payload.id,
                name: payload.name,
              });
              break;
            case 'StationUpdated':
              if (!payload.name) throw new Error('Name required for StationUpdated');
              await this.stationReadModelRepository.update(payload.id, payload.name);
              break;
            case 'StationDeleted':
              await this.stationReadModelRepository.remove(payload.id);
              break;
          }

          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error processing station event, moving to DLQ', error);
          // nack with requeue=false sends it to the configured deadLetterExchange
          this.channel?.nack(msg, false, false);
        }
      });

      console.info('RabbitMQ StationEventConsumer started successfully');
    } catch (error) {
      console.error('Failed to start RabbitMQ consumer:', error);
      this.reconnect();
    } finally {
      this.reconnecting = false;
    }
  }

  private reconnect(): void {
    if (this.reconnecting) return;
    this.model = null;
    this.channel = null;
    console.info('Attempting to reconnect RabbitMQ consumer in 5 seconds...');
    setTimeout(() => {
      this.start().catch(console.error);
    }, 5000);
  }

  async stop(): Promise<void> {
    this.reconnecting = true; // Prevent automatic reconnection on intentional stop
    await this.channel?.close();
    await this.model?.close();
  }
}

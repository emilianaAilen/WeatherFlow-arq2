import amqplib, { Channel, ChannelModel } from 'amqplib';
import { z } from 'zod';
import { IStationReadModelRepository } from '@/infrastructure/ports/IStationReadModelRepository';
import { logger } from '@/infrastructure/logger';

const EXCHANGE = 'station-events';
const QUEUE = 'alerting.station-events';
const DLX_EXCHANGE = 'alerting.station-events-dlx';
const DLQ = 'alerting.station-events-dlq';

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
        logger.error({ err }, 'RabbitMQ station event consumer connection error');
        this.reconnect();
      });

      this.model.on('close', () => {
        logger.info('RabbitMQ station event consumer connection closed');
        this.reconnect();
      });

      this.channel = await this.model.createChannel();

      this.channel.on('error', (err) => {
        logger.error({ err }, 'RabbitMQ station event consumer channel error');
        this.reconnect();
      });

      this.channel.on('close', () => {
        logger.info('RabbitMQ station event consumer channel closed');
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
          const payload = EventPayloadSchema.parse(rawPayload);

          switch (payload.eventType) {
            case 'StationCreated':
              if (!payload.name) throw new Error('Name required for StationCreated');
              await this.stationReadModelRepository.save({
                id: payload.id,
                name: payload.name,
              });
              logger.info({ stationId: payload.id, name: payload.name }, 'Station added to read model');
              break;
            case 'StationUpdated':
              if (!payload.name) throw new Error('Name required for StationUpdated');
              await this.stationReadModelRepository.update(payload.id, payload.name);
              logger.info({ stationId: payload.id, name: payload.name }, 'Station updated in read model');
              break;
            case 'StationDeleted':
              await this.stationReadModelRepository.remove(payload.id);
              logger.info({ stationId: payload.id }, 'Station removed from read model');
              break;
          }

          this.channel?.ack(msg);
        } catch (error) {
          logger.error({ error: (error as Error).message }, 'Error processing station event, moving to DLQ');
          this.channel?.nack(msg, false, false);
        }
      });

      logger.info('RabbitMQ StationEventConsumer (alerting) started successfully');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to start station event consumer');
      this.reconnect();
    } finally {
      this.reconnecting = false;
    }
  }

  private reconnect(): void {
    if (this.reconnecting) return;
    this.model = null;
    this.channel = null;
    logger.info('Attempting to reconnect station event consumer in 5 seconds...');
    setTimeout(() => {
      this.start().catch((err) => logger.error({ err }, 'Reconnect failed'));
    }, 5000);
  }

  async stop(): Promise<void> {
    this.reconnecting = true;
    await this.channel?.close();
    await this.model?.close();
  }
}

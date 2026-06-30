import amqplib, { Channel, ChannelModel } from 'amqplib';
import { z } from 'zod';
import { IMonitoredStationRepository } from '@/infrastructure/ports';
import { MonitoredStation } from '@/domain';
import { context, trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { logger } from '@/infrastructure/logger';
import { extractTraceContext } from '@/infrastructure/telemetry/amqpPropagation';

const EXCHANGE = 'station-events';
const QUEUE = 'ingesting.station-events';
const DLX_EXCHANGE = 'ingesting.station-events-dlx';
const DLQ = 'ingesting.station-events-dlq';

const EventPayloadSchema = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('StationCreated'),
    id: z.string(),
    name: z.string(),
    receivesExternalData: z.boolean(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  z.object({
    eventType: z.literal('StationUpdated'),
    id: z.string(),
    name: z.string(),
    receivesExternalData: z.boolean(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  z.object({
    eventType: z.literal('StationDeleted'),
    id: z.string(),
  }),
]);

export class RabbitMQStationEventConsumer {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;
  private reconnecting = false;

  constructor(
    private readonly url: string,
    private readonly monitoredStationRepository: IMonitoredStationRepository,
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

        const parentCtx = extractTraceContext(msg.properties.headers);
        const span = trace.getTracer('ingesting').startSpan('rabbitmq.consume ingesting.station-events', {
          kind: SpanKind.CONSUMER,
        });

        await context.with(trace.setSpan(parentCtx, span), async () => {
        try {
          const rawPayload = JSON.parse(msg.content.toString());
          const payload = EventPayloadSchema.parse(rawPayload);

          switch (payload.eventType) {
            case 'StationCreated':
              if (payload.receivesExternalData) {
                await this.monitoredStationRepository.save(
                  MonitoredStation.create(payload.id, payload.name, payload.latitude, payload.longitude),
                );
                logger.info({ stationId: payload.id, name: payload.name }, 'Station registered for external data ingestion');
              }
              break;

            case 'StationUpdated': {
              const existing = await this.monitoredStationRepository.findById(payload.id);
              if (payload.receivesExternalData) {
                if (existing) {
                  await this.monitoredStationRepository.update(payload.id, payload.name, payload.latitude, payload.longitude);
                } else {
                  await this.monitoredStationRepository.save(
                    MonitoredStation.create(payload.id, payload.name, payload.latitude, payload.longitude),
                  );
                  logger.info({ stationId: payload.id, name: payload.name }, 'Station registered for external data ingestion');
                }
              } else {
                if (existing) {
                  await this.monitoredStationRepository.remove(payload.id);
                  logger.info({ stationId: payload.id }, 'Station removed from external data ingestion');
                }
              }
              break;
            }

            case 'StationDeleted':
              await this.monitoredStationRepository.remove(payload.id);
              logger.info({ stationId: payload.id }, 'Station removed from external data ingestion');
              break;
          }

          span.setStatus({ code: SpanStatusCode.OK });
          this.channel?.ack(msg);
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          logger.error({ error: (error as Error).message }, 'Error processing station event, moving to DLQ');
          this.channel?.nack(msg, false, false);
        } finally {
          span.end();
        }
        });
      });

      logger.info('RabbitMQ StationEventConsumer (ingesting) started successfully');
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

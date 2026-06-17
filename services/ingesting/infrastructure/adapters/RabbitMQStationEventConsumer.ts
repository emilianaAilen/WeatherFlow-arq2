import amqplib, { Channel, ChannelModel } from 'amqplib';
import { z } from 'zod';
import { IMonitoredStationRepository } from '@/infrastructure/ports';
import { MonitoredStation } from '@/domain';

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

      // Assert source fanout exchange
      await this.channel.assertExchange(EXCHANGE, 'fanout', { durable: true });

      // Assert DLX and DLQ
      await this.channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });
      await this.channel.assertQueue(DLQ, { durable: true });
      await this.channel.bindQueue(DLQ, DLX_EXCHANGE, '');

      // Assert dedicated queue for this consumer and bind to source exchange
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
              if (payload.receivesExternalData) {
                await this.monitoredStationRepository.save(
                  MonitoredStation.create(payload.id, payload.name, payload.latitude, payload.longitude),
                );
                console.info(`Station ${payload.id} registered for external data ingestion`);
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
                  console.info(`Station ${payload.id} registered for external data ingestion`);
                }
              } else {
                if (existing) {
                  await this.monitoredStationRepository.remove(payload.id);
                  console.info(`Station ${payload.id} removed from external data ingestion`);
                }
              }
              break;
            }

            case 'StationDeleted':
              await this.monitoredStationRepository.remove(payload.id);
              break;
          }

          this.channel?.ack(msg);
        } catch (error) {
          console.error('Error processing station event, moving to DLQ', error);
          this.channel?.nack(msg, false, false);
        }
      });

      console.info('RabbitMQ StationEventConsumer (ingesting) started successfully');
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
    this.reconnecting = true;
    await this.channel?.close();
    await this.model?.close();
  }
}

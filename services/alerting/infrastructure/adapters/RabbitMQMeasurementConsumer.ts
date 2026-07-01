import amqplib, { Channel, ChannelModel } from 'amqplib';
import { z } from 'zod';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import { context, trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { logger } from '@/infrastructure/logger';
import { measurementsConsumedTotal, dlqMessagesTotal } from '@/infrastructure/telemetry/metrics';
import { extractTraceContext } from '@/infrastructure/telemetry/amqpPropagation';

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
        logger.error({ err }, 'RabbitMQ measurement consumer connection error');
        this.reconnect();
      });

      this.model.on('close', () => {
        logger.info('RabbitMQ measurement consumer connection closed');
        this.reconnect();
      });

      this.channel = await this.model.createChannel();

      this.channel.on('error', (err) => {
        logger.error({ err }, 'RabbitMQ measurement consumer channel error');
        this.reconnect();
      });

      this.channel.on('close', () => {
        logger.info('RabbitMQ measurement consumer channel closed');
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

        const parentCtx = extractTraceContext(msg.properties?.headers);
        const span = trace.getTracer('alerting').startSpan('rabbitmq.consume alerting.ingested-measurements', {
          kind: SpanKind.CONSUMER,
        });

        await context.with(trace.setSpan(parentCtx, span), async () => {
          try {
            const rawPayload = JSON.parse(msg.content.toString());
            const payload = MeasurementPayloadSchema.parse(rawPayload);

            await this.measurementService.createMeasurement(payload);
            measurementsConsumedTotal.inc({ status: 'success' });
            span.setStatus({ code: SpanStatusCode.OK });
            logger.info({ stationId: payload.stationId }, 'Measurement consumed from RabbitMQ');

            this.channel?.ack(msg);
          } catch (error) {
            measurementsConsumedTotal.inc({ status: 'error' });
            dlqMessagesTotal.inc();
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            logger.error({ error: (error as Error).message }, 'Error processing ingested measurement, moving to DLQ');
            this.channel?.nack(msg, false, false);
          } finally {
            span.end();
          }
        });
      });

      logger.info('RabbitMQ MeasurementConsumer (alerting) started successfully');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to start measurement consumer');
      this.reconnect();
    } finally {
      this.reconnecting = false;
    }
  }

  private reconnect(): void {
    if (this.reconnecting) return;
    this.model = null;
    this.channel = null;
    logger.info('Attempting to reconnect measurement consumer in 5 seconds...');
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

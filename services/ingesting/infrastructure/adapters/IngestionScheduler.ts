import cron from 'node-cron';
import { context, trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { WeatherIngestionService } from '@/application/WeatherIngestionService';
import { logger } from '@/infrastructure/logger';
import { ingestionCycleDurationMs } from '@/infrastructure/telemetry/metrics';

export class IngestionScheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(
    private readonly ingestionService: WeatherIngestionService,
    private readonly cronExpression: string,
  ) {}

  start(): void {
    this.task = cron.schedule(this.cronExpression, async () => {
      if (this.isRunning) {
        logger.warn({ cron: this.cronExpression }, 'Previous ingestion cycle still running, skipping this tick');
        return;
      }
      this.isRunning = true;
      const stopTimer = ingestionCycleDurationMs.startTimer();
      const span = trace.getTracer('ingesting').startSpan('ingestion.cycle', { kind: SpanKind.INTERNAL });

      await context.with(trace.setSpan(context.active(), span), async () => {
        try {
          await this.ingestionService.runIngestionCycle();
          span.setStatus({ code: SpanStatusCode.OK });
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          logger.error({ error: (error as Error).message }, 'Ingestion cycle failed unexpectedly');
        } finally {
          stopTimer();
          span.end();
          this.isRunning = false;
        }
      });
    });
    logger.info({ cron: this.cronExpression }, 'Ingestion scheduler started');
  }

  stop(): void {
    this.task?.stop();
    logger.info('Ingestion scheduler stopped');
  }
}

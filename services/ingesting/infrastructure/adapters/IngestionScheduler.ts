import cron from 'node-cron';
import { WeatherIngestionService } from '@/application/WeatherIngestionService';
import { logger } from '@/infrastructure/logger';

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
      try {
        await this.ingestionService.runIngestionCycle();
      } catch (error) {
        logger.error({ error: (error as Error).message }, 'Ingestion cycle failed unexpectedly');
      } finally {
        this.isRunning = false;
      }
    });
    logger.info({ cron: this.cronExpression }, 'Ingestion scheduler started');
  }

  stop(): void {
    this.task?.stop();
    logger.info('Ingestion scheduler stopped');
  }
}

import cron from 'node-cron';
import { WeatherIngestionService } from '@/application/WeatherIngestionService';

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
        console.warn('Previous ingestion cycle still running, skipping this tick');
        return;
      }
      this.isRunning = true;
      try {
        await this.ingestionService.runIngestionCycle();
      } catch (error) {
        console.error('Ingestion cycle failed unexpectedly', error);
      } finally {
        this.isRunning = false;
      }
    });
    console.info(`Ingestion scheduler started (cron: ${this.cronExpression})`);
  }

  stop(): void {
    this.task?.stop();
  }
}

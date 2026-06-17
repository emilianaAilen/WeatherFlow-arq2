import {
  MonitoredStationRepository,
  RabbitMQStationEventConsumer,
  OWMHttpClient,
  AlertingHttpClient,
} from './adapters';
import { IngestionScheduler } from './adapters/IngestionScheduler';
import { MonitoredStationController } from '@/user-interface/adapters/controllers';
import { MonitoredStationService } from '@/application/MonitoredStationService';
import { WeatherIngestionService } from '@/application/WeatherIngestionService';

if (!process.env.OWM_API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('OWM_API_KEY is not set — weather ingestion will not fetch real data');
}

const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5';

const monitoredStationRepository = new MonitoredStationRepository();

export const stationEventConsumer = new RabbitMQStationEventConsumer(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
  monitoredStationRepository,
);

const owmClient = new OWMHttpClient(
  process.env.OWM_API_KEY ?? '',
  process.env.OWM_BASE_URL ?? OWM_BASE_URL,
);

const alertingClient = new AlertingHttpClient(
  process.env.ALERTING_BASE_URL ?? 'http://alerting:3000',
);

const weatherIngestionService = new WeatherIngestionService(
  monitoredStationRepository,
  owmClient,
  alertingClient,
);

export const ingestionScheduler = new IngestionScheduler(
  weatherIngestionService,
  process.env.OWM_CRON ?? '*/5 * * * *',
);

export const monitoredStationController = new MonitoredStationController(
  new MonitoredStationService(monitoredStationRepository),
);

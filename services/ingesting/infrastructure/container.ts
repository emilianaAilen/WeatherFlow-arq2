import {
  MonitoredStationRepository,
  RabbitMQStationEventConsumer,
  OWMHttpClient,
  RabbitMQMeasurementPublisher,
} from './adapters';
import { IngestionScheduler } from './adapters/IngestionScheduler';
import { CircuitBreaker } from './fault-tolerance/CircuitBreaker';
import { MonitoredStationController } from '@/user-interface/adapters/controllers';
import { MonitoredStationService } from '@/application/MonitoredStationService';
import { WeatherIngestionService } from '@/application/WeatherIngestionService';

if (!process.env.OWM_API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('OWM_API_KEY is not set — weather ingestion will not fetch real data');
}

const monitoredStationRepository = new MonitoredStationRepository();

export const stationEventConsumer = new RabbitMQStationEventConsumer(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
  monitoredStationRepository,
);

const owmCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  successThreshold: 1,
  openDurationMs: 30_000,
});

const owmClient = new OWMHttpClient(
  process.env.OWM_API_KEY ?? '',
  owmCircuitBreaker,
  parseInt(process.env.OWM_TIMEOUT_MS ?? '5000', 10),
  process.env.OWM_BASE_URL,
);

const measurementPublisher = new RabbitMQMeasurementPublisher(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
);

const weatherIngestionService = new WeatherIngestionService(
  monitoredStationRepository,
  owmClient,
  measurementPublisher,
);

export const ingestionScheduler = new IngestionScheduler(
  weatherIngestionService,
  process.env.OWM_CRON ?? '*/5 * * * *',
);

export const monitoredStationController = new MonitoredStationController(
  new MonitoredStationService(monitoredStationRepository),
);

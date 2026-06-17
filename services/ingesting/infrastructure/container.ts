import { MonitoredStationRepository, RabbitMQStationEventConsumer } from './adapters';
import { MonitoredStationController } from '@/user-interface/adapters/controllers';
import { MonitoredStationService } from '@/application/MonitoredStationService';

const monitoredStationRepository = new MonitoredStationRepository();

export const stationEventConsumer = new RabbitMQStationEventConsumer(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
  monitoredStationRepository,
);

export const monitoredStationController = new MonitoredStationController(
  new MonitoredStationService(monitoredStationRepository),
);

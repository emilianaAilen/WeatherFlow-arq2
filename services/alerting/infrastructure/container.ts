import { ClimateMeasurementController } from "@/user-interface/adapters/controllers";
import { ClimateMeasurementRepository, RabbitMQNotificationQueue, StationReadModelRepository, RabbitMQStationEventConsumer } from "./adapters";
import { ClimateMeasurementService } from "@/application/ClimateMeasurementService";

const stationReadModelRepository = new StationReadModelRepository();
const climateMeasurementRepository = new ClimateMeasurementRepository();
export const stationEventConsumer = new RabbitMQStationEventConsumer(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
  stationReadModelRepository
);
const notificationQueue = new RabbitMQNotificationQueue(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
);

export const measurementController = new ClimateMeasurementController(
  new ClimateMeasurementService(climateMeasurementRepository, stationReadModelRepository, notificationQueue),
);

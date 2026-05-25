import { UserController, WeatherStationController, ClimateMeasurementController } from "@/user-interface/adapters/controllers";
import { UserRepository, WeatherStationRepository, ClimateMeasurementRepository, RabbitMQNotificationQueue, StationReadModelRepository, RabbitMQStationEventConsumer } from "./adapters";
import { UserService } from "@/application/UserService";
import { WeatherStationService } from "@/application/WeatherStationService";
import { ClimateMeasurementService } from "@/application/ClimateMeasurementService";

const userRepository = new UserRepository();
const weatherStationRepository = new WeatherStationRepository();
const stationReadModelRepository = new StationReadModelRepository();
const climateMeasurementRepository = new ClimateMeasurementRepository();
export const stationEventConsumer = new RabbitMQStationEventConsumer(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
  stationReadModelRepository
);
const notificationQueue = new RabbitMQNotificationQueue(
  process.env.RABBITMQ_URL ?? 'amqp://localhost',
);

export const userController = new UserController(
  new UserService(userRepository, weatherStationRepository),
);

export const weatherStationController = new WeatherStationController(
  new WeatherStationService(weatherStationRepository, userRepository, climateMeasurementRepository),
);

export const measurementController = new ClimateMeasurementController(
  new ClimateMeasurementService(climateMeasurementRepository, stationReadModelRepository, notificationQueue),
);

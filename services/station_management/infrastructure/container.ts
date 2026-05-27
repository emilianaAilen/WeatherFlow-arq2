import { UserController, WeatherStationController } from '@/user-interface/adapters/controllers';
import {
  UserRepository,
  WeatherStationRepository,
  RabbitMQStationEventPublisher,
} from './adapters';
import { UserService } from '@/application/UserService';
import { WeatherStationService } from '@/application/WeatherStationService';

const userRepository = new UserRepository();
const weatherStationRepository = new WeatherStationRepository();
export const stationEventPublisher = new RabbitMQStationEventPublisher(
  process.env.RABBITMQ_URL || 'amqp://localhost:5672',
);

export const userController = new UserController(
  new UserService(userRepository, weatherStationRepository),
);

export const weatherStationController = new WeatherStationController(
  new WeatherStationService(weatherStationRepository, userRepository, stationEventPublisher),
);

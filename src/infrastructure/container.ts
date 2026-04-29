import { UserController, WeatherStationController, ClimateMeasurementController } from "@/user-interface/adapters/controllers";
import { UserRepository, WeatherStationRepository, ClimateMeasurementRepository } from "./adapters";
import { UserService } from "@/application/UserService";
import { WeatherStationService } from "@/application/WeatherStationService";
import { ClimateMeasurementService } from "@/application/ClimateMeasurementService";

const userRepository = new UserRepository();
const weatherStationRepository = new WeatherStationRepository();
const climateMeasurementRepository = new ClimateMeasurementRepository();

export const userController = new UserController(
  new UserService(userRepository, weatherStationRepository),
);

export const weatherStationController = new WeatherStationController(
  new WeatherStationService(weatherStationRepository, userRepository, climateMeasurementRepository),
);

export const measurementController = new ClimateMeasurementController(
  new ClimateMeasurementService(climateMeasurementRepository, weatherStationRepository),
);
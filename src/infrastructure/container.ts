import { UserController } from "@/user-interface/adapters/controllers";
import { UserRepository, WeatherStationRepository } from "./adapters";
import { UserService } from "@/application/UserService";

export const userController = new UserController(
  new UserService(new UserRepository(), new WeatherStationRepository()),
);
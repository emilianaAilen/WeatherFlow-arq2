import { AlertType } from "../types";
import { Humidity } from "./Humidity";
import { Pressure } from "./Pressure";
import { Temperature } from "./Temperature";

export class Alert {
  readonly status: boolean;
  readonly type: AlertType;

  private constructor(status: boolean, type: AlertType) {
    this.status = status;
    this.type = type;
  }

  static create(status: boolean, type: AlertType): Alert {
    return new Alert(status, type);
  }

  static none(): Alert {
    return new Alert(false, AlertType.NONE);
  }

  // TODO: Implement logic to determine alert type and status based on temperature, humidity, and pressure values
  static fromValue(
    _temperature: Temperature,
    _humidity: Humidity,
    _pressure: Pressure,
  ): Alert {
    return Alert.none();
  }

  isActiveAlert(): boolean {
    return this.status;
  }

  getType(): AlertType {
    return this.type;
  }
}

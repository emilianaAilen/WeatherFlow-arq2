import { AlertType } from '../../types';
import { Humidity } from '../Humidity';
import { Pressure } from '../Pressure';
import { Temperature } from '../Temperature';

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

  static fromValues(temperature: Temperature, humidity: Humidity, pressure: Pressure): Alert {
    if (temperature.isExtremeHeat()) return new Alert(true, AlertType.EXTREME_HEAT);
    if (temperature.isFrost()) return new Alert(true, AlertType.FROST);
    if (pressure.isLowPressure()) return new Alert(true, AlertType.STORM);
    if (humidity.isCritical()) return new Alert(true, AlertType.CRITICAL_HUMIDITY);
    return Alert.none();
  }

  isActiveAlert(): boolean {
    return this.status;
  }

  getType(): AlertType {
    return this.type;
  }
}

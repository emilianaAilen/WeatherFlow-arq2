import { Temperature } from '../value-objects/Temperature';
import { Humidity } from '../value-objects/Humidity';
import { Pressure } from '../value-objects/Pressure';
import { Alert } from '../value-objects/Alert';

export class ClimateMeasurement {
  readonly id: string;
  readonly temperature: Temperature;
  readonly humidity: Humidity;
  readonly atmosphericPressure: Pressure;
  readonly dateTime: Date;
  readonly alert: Alert;
  readonly stationId: string;

  constructor(
    id: string,
    temperature: Temperature,
    humidity: Humidity,
    atmosphericPressure: Pressure,
    dateTime: Date,
    alert: Alert,
    stationId: string
  ) {
    this.id = id;
    this.temperature = temperature;
    this.humidity = humidity;
    this.atmosphericPressure = atmosphericPressure;
    this.dateTime = dateTime;
    this.alert = alert;
    this.stationId = stationId;
  }

  static create(
    id: string,
    temperature: number,
    humidity: number,
    atmosphericPressure: number,
    dateTime: Date,
    _alert: Alert,
    stationId: string
  ): ClimateMeasurement {
    const temperatureObj = new Temperature(temperature);
    const humidityObj = new Humidity(humidity);
    const pressureObj = new Pressure(atmosphericPressure);
    const alertObj = Alert.fromValue(temperatureObj, humidityObj, pressureObj);
    
    return new ClimateMeasurement(
      id,
      temperatureObj,
      humidityObj,
      pressureObj,
      dateTime,
      alertObj,
      stationId
    );
  }

  getTemperature(): Temperature {
    return this.temperature;
  }

  getHumidity(): Humidity {
    return this.humidity;
  }

  getAtmosphericPressure(): Pressure {
    return this.atmosphericPressure;
  }

  getDateTime(): Date {
    return this.dateTime;
  }

  getAlert(): Alert {
    return this.alert;
  }

  getStationId(): string {
    return this.stationId;
  }
}

import { Location } from '../../value-objects/Location';
import { StationStatusType } from '../../types';

export class WeatherStation {
  readonly id: string;
  readonly name: string;
  readonly location: Location;
  readonly sensorModel: string;
  readonly status: StationStatusType;
  readonly ownerId: string;

  constructor(
    id: string,
    name: string,
    location: Location,
    sensorModel: string,
    status: StationStatusType,
    ownerId: string,
  ) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.sensorModel = sensorModel;
    this.status = status;
    this.ownerId = ownerId;
  }

  static create(
    id: string,
    name: string,
    location: Location,
    sensorModel: string,
    status: StationStatusType,
    ownerId: string,
  ): WeatherStation {
    return new WeatherStation(id, name, location, sensorModel, status, ownerId);
  }

  getName(): string {
    return this.name;
  }

  getLocation(): Location {
    return this.location;
  }

  getSensorModel(): string {
    return this.sensorModel;
  }

  getStatus(): StationStatusType {
    return this.status;
  }

  getOwnerId(): string {
    return this.ownerId;
  }
}

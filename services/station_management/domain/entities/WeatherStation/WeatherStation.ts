import { Location } from '../../value-objects/Location';
import { StationStatusType } from '../../types';

export class WeatherStation {
  readonly id: string;
  readonly name: string;
  readonly location: Location;
  readonly sensorModel: string;
  readonly status: StationStatusType;
  readonly ownerId: string;
  readonly receivesExternalData: boolean;

  constructor(
    id: string,
    name: string,
    location: Location,
    sensorModel: string,
    status: StationStatusType,
    ownerId: string,
    receivesExternalData: boolean = false,
  ) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.sensorModel = sensorModel;
    this.status = status;
    this.ownerId = ownerId;
    this.receivesExternalData = receivesExternalData;
  }

  static create(
    id: string,
    name: string,
    location: Location,
    sensorModel: string,
    status: StationStatusType,
    ownerId: string,
    receivesExternalData: boolean = false,
  ): WeatherStation {
    return new WeatherStation(id, name, location, sensorModel, status, ownerId, receivesExternalData);
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

  getReceivesExternalData(): boolean {
    return this.receivesExternalData;
  }
}

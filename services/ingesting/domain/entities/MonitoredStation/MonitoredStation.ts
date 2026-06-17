export class MonitoredStation {
  readonly id: string;
  readonly name: string;
  readonly alertingStationId: string;
  readonly latitude: number;
  readonly longitude: number;

  constructor(id: string, name: string, alertingStationId: string, latitude: number, longitude: number) {
    this.id = id;
    this.name = name;
    this.alertingStationId = alertingStationId;
    this.latitude = latitude;
    this.longitude = longitude;
  }

  static create(id: string, name: string, latitude: number, longitude: number): MonitoredStation {
    return new MonitoredStation(id, name, id, latitude, longitude);
  }
}

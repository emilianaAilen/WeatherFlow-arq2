export class MonitoredStation {
  readonly id: string;
  readonly name: string;
  readonly alertingStationId: string;

  constructor(id: string, name: string, alertingStationId: string) {
    this.id = id;
    this.name = name;
    this.alertingStationId = alertingStationId;
  }

  static create(id: string, name: string): MonitoredStation {
    return new MonitoredStation(id, name, id);
  }
}

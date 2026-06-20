export interface MeasurementMessage {
  temperature: number;
  humidity: number;
  atmosphericPressure: number;
  stationId: string;
}

export interface IMeasurementPublisher {
  publish(message: MeasurementMessage): Promise<void>;
}

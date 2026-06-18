export interface MeasurementPayload {
  temperature: number;
  humidity: number;
  atmosphericPressure: number;
  stationId: string;
}

export interface IAlertingClient {
  postMeasurement(payload: MeasurementPayload): Promise<void>;
}

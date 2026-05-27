export interface RepositoryMeasurementFilters {
  stationId?: string;
  minTemperature?: number;
  maxTemperature?: number;
  minHumidity?: number;
  maxHumidity?: number;
  minPressure?: number;
  maxPressure?: number;
  isActiveAlert?: boolean;
}

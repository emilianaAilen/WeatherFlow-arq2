export interface RepositoryMeasurementFilters {
  stationId?: string;
  minTemperature?: number;
  maxTemperature?: number;
  isActiveAlert?: boolean;
  startDate?: Date;
  endDate?: Date;
}
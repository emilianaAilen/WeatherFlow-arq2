export interface HourlyTemperaturePoint {
  time: string;
  temperature: number | null;
}

export interface DailyAverageResult {
  stationId: string;
  averageTemperature: number;
  from: Date;
  to: Date;
  data: HourlyTemperaturePoint[];
}

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

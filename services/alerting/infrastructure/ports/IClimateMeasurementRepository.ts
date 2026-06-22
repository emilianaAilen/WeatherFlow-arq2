import { ClimateMeasurement } from '@/domain';
import { RepositoryMeasurementFilters } from '../types';

export interface IClimateMeasurementRepository {
  save(measurement: ClimateMeasurement): Promise<void>;
  findById(id: string): Promise<ClimateMeasurement | null>;
  update(id: string, measurement: ClimateMeasurement): Promise<void>;
  findByStationId(stationId: string): Promise<ClimateMeasurement | null>;
  findLatestByStationId(stationId: string): Promise<ClimateMeasurement | null>;
  getHourlyTemperaturesByStationId(stationId: string, since: Date): Promise<{ hourStart: Date; averageTemperature: number }[]>;
  getWeeklyAverageTemperatureByStationId(stationId: string, since: Date): Promise<{ dayStart: Date; averageTemperature: number }[]>;
  remove(id: string): Promise<void>;
  getAll(): Promise<ClimateMeasurement[]>;
  filterMeasurementsBy(filters: RepositoryMeasurementFilters): Promise<ClimateMeasurement[]>;
}

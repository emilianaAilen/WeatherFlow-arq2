import { ClimateMeasurement } from '@/domain';

export interface IClimateMeasurementRepository {
  save(measurement: ClimateMeasurement): Promise<void>;
  findById(id: string): Promise<ClimateMeasurement | null>;
  findByStationId(stationId: string): Promise<ClimateMeasurement | null>;
  remove(id: string): Promise<void>;
  getAll(): Promise<ClimateMeasurement[]>;
}

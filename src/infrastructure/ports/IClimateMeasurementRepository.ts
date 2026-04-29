import { ClimateMeasurement } from '@/domain';

export interface IClimateMeasurementRepository {
  save(measurement: ClimateMeasurement): Promise<void>;
  findById(id: string): Promise<ClimateMeasurement | null>;
  update(id: string, measurement: ClimateMeasurement): Promise<void>;
  findByStationId(stationId: string): Promise<ClimateMeasurement | null>;
  remove(id: string): Promise<void>;
  getAll(): Promise<ClimateMeasurement[]>;
}

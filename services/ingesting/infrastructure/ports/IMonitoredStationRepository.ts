import { MonitoredStation } from '@/domain';

export interface IMonitoredStationRepository {
  save(station: MonitoredStation): Promise<void>;
  findById(id: string): Promise<MonitoredStation | null>;
  findAll(): Promise<MonitoredStation[]>;
  update(id: string, name: string, latitude: number, longitude: number): Promise<void>;
  remove(id: string): Promise<void>;
}

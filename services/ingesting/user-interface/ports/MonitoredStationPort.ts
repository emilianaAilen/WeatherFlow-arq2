import { MonitoredStation } from '@/domain';

export interface MonitoredStationPort {
  getAll(): Promise<MonitoredStation[]>;
  getById(id: string): Promise<MonitoredStation>;
}

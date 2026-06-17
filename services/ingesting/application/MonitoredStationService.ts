import { MonitoredStation, NotFoundError } from '@/domain';
import { IMonitoredStationRepository } from '@/infrastructure/ports';
import { MonitoredStationPort } from '@/user-interface/ports/MonitoredStationPort';

export class MonitoredStationService implements MonitoredStationPort {
  constructor(private readonly monitoredStationRepository: IMonitoredStationRepository) {}

  async getAll(): Promise<MonitoredStation[]> {
    return this.monitoredStationRepository.findAll();
  }

  async getById(id: string): Promise<MonitoredStation> {
    const station = await this.monitoredStationRepository.findById(id);
    if (!station) {
      throw new NotFoundError(`Monitored station with id ${id} not found`);
    }
    return station;
  }
}

import { MonitoredStation } from '@/domain';
import { IMonitoredStationRepository } from '@/infrastructure/ports';
import { MonitoredStationModel } from '@/infrastructure/database/schemas/MonitoredStationSchema';

export class MonitoredStationRepository implements IMonitoredStationRepository {
  async save(station: MonitoredStation): Promise<void> {
    await MonitoredStationModel.create({
      _id: station.id,
      name: station.name,
      alertingStationId: station.alertingStationId,
    });
  }

  async findById(id: string): Promise<MonitoredStation | null> {
    const doc = await MonitoredStationModel.findById(id).exec();
    if (!doc) return null;
    return new MonitoredStation(doc._id, doc.name, doc.alertingStationId);
  }

  async findAll(): Promise<MonitoredStation[]> {
    const docs = await MonitoredStationModel.find().exec();
    return docs.map((doc) => new MonitoredStation(doc._id, doc.name, doc.alertingStationId));
  }

  async update(id: string, name: string): Promise<void> {
    await MonitoredStationModel.findByIdAndUpdate(id, { name }).exec();
  }

  async remove(id: string): Promise<void> {
    await MonitoredStationModel.findByIdAndDelete(id).exec();
  }
}

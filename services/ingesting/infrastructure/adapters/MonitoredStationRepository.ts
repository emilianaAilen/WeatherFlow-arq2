import { MonitoredStation } from '@/domain';
import { IMonitoredStationRepository } from '@/infrastructure/ports';
import { MonitoredStationModel } from '@/infrastructure/database/schemas/MonitoredStationSchema';

export class MonitoredStationRepository implements IMonitoredStationRepository {
  async save(station: MonitoredStation): Promise<void> {
    await MonitoredStationModel.create({
      _id: station.id,
      name: station.name,
      alertingStationId: station.alertingStationId,
      latitude: station.latitude,
      longitude: station.longitude,
    });
  }

  async findById(id: string): Promise<MonitoredStation | null> {
    const doc = await MonitoredStationModel.findById(id).exec();
    if (!doc) return null;
    return new MonitoredStation(doc._id, doc.name, doc.alertingStationId, doc.latitude, doc.longitude);
  }

  async findAll(): Promise<MonitoredStation[]> {
    const docs = await MonitoredStationModel.find().exec();
    return docs.map((doc) => new MonitoredStation(doc._id, doc.name, doc.alertingStationId, doc.latitude, doc.longitude));
  }

  async update(id: string, name: string, latitude: number, longitude: number): Promise<void> {
    await MonitoredStationModel.findByIdAndUpdate(id, { name, latitude, longitude }).exec();
  }

  async remove(id: string): Promise<void> {
    await MonitoredStationModel.findByIdAndDelete(id).exec();
  }
}

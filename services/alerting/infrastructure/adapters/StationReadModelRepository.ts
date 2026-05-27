import {
  IStationReadModelRepository,
  StationReadModel,
} from '@/infrastructure/ports/IStationReadModelRepository';
import { StationReadModelModel } from '@/infrastructure/database/schemas/StationReadModelSchema';

export class StationReadModelRepository implements IStationReadModelRepository {
  async save(station: StationReadModel): Promise<void> {
    await StationReadModelModel.create({
      _id: station.id,
      name: station.name,
    });
  }

  async findById(id: string): Promise<StationReadModel | null> {
    const doc = await StationReadModelModel.findById(id).exec();
    if (!doc) return null;
    return { id: doc._id, name: doc.name };
  }

  async findByName(name: string): Promise<StationReadModel | null> {
    const doc = await StationReadModelModel.findOne({ name }).exec();
    if (!doc) return null;
    return { id: doc._id, name: doc.name };
  }

  async update(id: string, name: string): Promise<void> {
    await StationReadModelModel.findByIdAndUpdate(id, { name }).exec();
  }

  async remove(id: string): Promise<void> {
    await StationReadModelModel.findByIdAndDelete(id).exec();
  }
}

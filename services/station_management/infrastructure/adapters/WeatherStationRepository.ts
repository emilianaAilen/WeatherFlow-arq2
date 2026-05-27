import { WeatherStation, Location, StationStatusType } from '@/domain';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import {
  WeatherStationModel,
  IWeatherStationDocument,
} from '@/infrastructure/database/schemas/WeatherStationSchema';

export class WeatherStationRepository implements IWeatherStationRepository {
  private toDomain(doc: IWeatherStationDocument): WeatherStation {
    return WeatherStation.create(
      doc._id.toString(),
      doc.name,
      Location.create(doc.location.latitude, doc.location.longitude),
      doc.sensorModel,
      doc.status as StationStatusType,
      doc.ownerId.toString(),
    );
  }

  async save(station: WeatherStation): Promise<void> {
    await WeatherStationModel.create({
      _id: station.id,
      name: station.name,
      location: {
        latitude: station.location.getLatitude(),
        longitude: station.location.getLongitude(),
      },
      sensorModel: station.sensorModel,
      status: station.status,
      ownerId: station.ownerId,
    });
  }

  async findById(id: string): Promise<WeatherStation | null> {
    const doc = await WeatherStationModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, station: WeatherStation): Promise<void> {
    await WeatherStationModel.findByIdAndUpdate(id, {
      name: station.name,
      location: {
        latitude: station.location.getLatitude(),
        longitude: station.location.getLongitude(),
      },
      sensorModel: station.sensorModel,
      status: station.status,
      ownerId: station.ownerId,
    }).exec();
  }

  async remove(id: string): Promise<void> {
    await WeatherStationModel.findByIdAndDelete(id).exec();
  }

  async findStationByOwner(id: string): Promise<WeatherStation | null> {
    const doc = await WeatherStationModel.findOne({ ownerId: id }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findStationByName(name: string): Promise<WeatherStation | null> {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const doc = await WeatherStationModel.findOne({
      name: { $regex: `^${escaped}$`, $options: 'i' },
    }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async getAll(): Promise<WeatherStation[]> {
    const docs = await WeatherStationModel.find().exec();
    return docs.map(this.toDomain.bind(this));
  }
}

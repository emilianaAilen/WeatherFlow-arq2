import { ClimateMeasurement } from '@/domain';
import { IClimateMeasurementRepository } from '@/infrastructure/ports/IClimateMeasurementRepository';
import {
  ClimateMeasurementModel,
  IClimateMeasurementDocument,
} from '@/infrastructure/database/schemas/ClimateMeasurementSchema';
import { RepositoryMeasurementFilters } from '../types';

export class ClimateMeasurementRepository implements IClimateMeasurementRepository {
  private toDomain(doc: IClimateMeasurementDocument): ClimateMeasurement {
    return ClimateMeasurement.create(
      doc._id.toString(),
      doc.temperature,
      doc.humidity,
      doc.atmosphericPressure,
      doc.dateTime,
      doc.stationId.toString(),
    );
  }

  async save(measurement: ClimateMeasurement): Promise<void> {
    await ClimateMeasurementModel.create({
      _id: measurement.id,
      temperature: measurement.temperature.value,
      humidity: measurement.humidity.value,
      atmosphericPressure: measurement.atmosphericPressure.value,
      dateTime: measurement.dateTime,
      alert: {
        status: measurement.alert.isActiveAlert(),
        type: measurement.alert.getType(),
      },
      stationId: measurement.stationId,
    });
  }

  async findById(id: string): Promise<ClimateMeasurement | null> {
    const doc = await ClimateMeasurementModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(id: string, measurement: ClimateMeasurement): Promise<void> {
    await ClimateMeasurementModel.findByIdAndUpdate(id, {
      temperature: measurement.temperature.value,
      humidity: measurement.humidity.value,
      atmosphericPressure: measurement.atmosphericPressure.value,
      dateTime: measurement.dateTime,
      alert: {
        status: measurement.alert.isActiveAlert(),
        type: measurement.alert.getType(),
      },
    }).exec();
  }

  async findByStationId(stationId: string): Promise<ClimateMeasurement | null> {
    const doc = await ClimateMeasurementModel.findOne({ stationId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async remove(id: string): Promise<void> {
    await ClimateMeasurementModel.findByIdAndDelete(id).exec();
  }

  async getAll(): Promise<ClimateMeasurement[]> {
    const docs = await ClimateMeasurementModel.find().exec();
    return docs.map(this.toDomain.bind(this));
  }

  async filterMeasurementsBy(filters: RepositoryMeasurementFilters): Promise<ClimateMeasurement[]> {
    const query: Record<string, unknown> = {};

    if (filters.stationId !== undefined) {
      query.stationId = filters.stationId;
    }

    if (filters.minTemperature !== undefined || filters.maxTemperature !== undefined) {
      const tempQuery: Record<string, number> = {};
      if (filters.minTemperature !== undefined) tempQuery.$gte = filters.minTemperature;
      if (filters.maxTemperature !== undefined) tempQuery.$lte = filters.maxTemperature;
      query.temperature = tempQuery;
    }

    if (filters.isActiveAlert !== undefined) {
      query['alert.status'] = filters.isActiveAlert;
    }

    const docs = await ClimateMeasurementModel.find(query).exec();
    return docs.map(this.toDomain.bind(this));
  }
}

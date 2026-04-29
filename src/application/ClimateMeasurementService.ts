import crypto from 'crypto';
import { ClimateMeasurement } from '@/domain';
import { IClimateMeasurementRepository } from '@/infrastructure/ports/IClimateMeasurementRepository';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import { CreateMeasurementRequest } from '@/user-interface/dtos/CreateMeasurementDTO';

export class ClimateMeasurementService implements ClimateMeasurementPort {
  constructor(
    private readonly climateMeasurementRepository: IClimateMeasurementRepository,
    private readonly weatherStationRepository: IWeatherStationRepository,
  ) {}

  async createMeasurement(dto: CreateMeasurementRequest): Promise<ClimateMeasurement> {
    const station = await this.weatherStationRepository.findById(dto.stationId);
    if (!station) {
      const error = new Error('Weather station not found');
      (error as any).statusCode = 404;
      throw error;
    }
    const id = crypto.randomUUID();
    const measurement = ClimateMeasurement.create(
      id,
      dto.temperature,
      dto.humidity,
      dto.atmosphericPressure,
      new Date(),
      dto.stationId,
    );
    await this.climateMeasurementRepository.save(measurement);
    return measurement;
  }
}

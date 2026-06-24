import crypto from 'crypto';
import { ClimateMeasurement, NotFoundError } from '@/domain';
import { IClimateMeasurementRepository } from '@/infrastructure/ports/IClimateMeasurementRepository';
import { IStationReadModelRepository } from '@/infrastructure/ports/IStationReadModelRepository';
import { INotificationQueue } from '@/infrastructure/ports/INotificationQueue';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import { CreateMeasurementRequest } from '@/user-interface/dtos/CreateMeasurementDTO';
import { UpdateMeasurementRequest } from '@/user-interface/dtos/UpdateMeasurementDTO';
import { MeasurementFilters } from '@/user-interface/dtos/MeasurementFiltersDTO';
import { RepositoryMeasurementFilters } from '@/infrastructure/types';
import { logger } from '@/infrastructure/logger';

export class ClimateMeasurementService implements ClimateMeasurementPort {
  constructor(
    private readonly climateMeasurementRepository: IClimateMeasurementRepository,
    private readonly stationReadModelRepository: IStationReadModelRepository,
    private readonly notificationQueue: INotificationQueue,
  ) {}

  async getMeasurementById(id: string): Promise<ClimateMeasurement | null> {
    return this.climateMeasurementRepository.findById(id);
  }

  async deleteMeasurement(id: string): Promise<void> {
    const existing = await this.climateMeasurementRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Climate measurement not found');
    }
    await this.climateMeasurementRepository.remove(id);
  }

  async updateMeasurement(id: string, dto: UpdateMeasurementRequest): Promise<ClimateMeasurement> {
    const existing = await this.climateMeasurementRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Climate measurement not found');
    }
    const updated = ClimateMeasurement.create(
      existing.id,
      dto.temperature ?? existing.temperature.value,
      dto.humidity ?? existing.humidity.value,
      dto.atmosphericPressure ?? existing.atmosphericPressure.value,
      new Date(),
      existing.stationId,
    );
    await this.climateMeasurementRepository.update(id, updated);
    if (updated.alert.isActiveAlert()) {
      await this.notificationQueue.publish(updated);
    }
    return updated;
  }

  async getCurrentMeasurementByStationId(stationId: string): Promise<ClimateMeasurement | null> {
    return this.climateMeasurementRepository.findLatestByStationId(stationId);
  }

  async search(filters: MeasurementFilters): Promise<ClimateMeasurement[]> {
    const repoFilters: RepositoryMeasurementFilters = {
      minTemperature: filters.minTemperature,
      maxTemperature: filters.maxTemperature,
      minHumidity: filters.minHumidity,
      maxHumidity: filters.maxHumidity,
      minPressure: filters.minPressure,
      maxPressure: filters.maxPressure,
      isActiveAlert: filters.isActiveAlert,
    };

    if (filters.stationName !== undefined) {
      const station = await this.stationReadModelRepository.findByName(filters.stationName);
      if (!station) return [];
      repoFilters.stationId = station.id;
    }

    return this.climateMeasurementRepository.filterMeasurementsBy(repoFilters);
  }

  async createMeasurement(dto: CreateMeasurementRequest): Promise<ClimateMeasurement> {
    const station = await this.stationReadModelRepository.findById(dto.stationId);
    if (!station) {
      throw new NotFoundError('Weather station not found');
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

    logger.info(
      { stationId: dto.stationId, temperature: dto.temperature, humidity: dto.humidity, pressure: dto.atmosphericPressure },
      'Measurement created',
    );

    if (measurement.alert.isActiveAlert()) {
      logger.warn(
        { stationId: dto.stationId, alertType: measurement.alert.getType(),
          temperature: dto.temperature, humidity: dto.humidity, pressure: dto.atmosphericPressure },
        'Alert triggered',
      );
      await this.notificationQueue.publish(measurement);
    }

    return measurement;
  }
}

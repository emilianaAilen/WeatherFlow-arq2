import crypto from 'crypto';
import { ClimateMeasurement, NotFoundError } from '@/domain';
import { IClimateMeasurementRepository } from '@/infrastructure/ports/IClimateMeasurementRepository';
import { IStationReadModelRepository } from '@/infrastructure/ports/IStationReadModelRepository';
import { INotificationQueue } from '@/infrastructure/ports/INotificationQueue';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import { CreateMeasurementRequest } from '@/user-interface/dtos/CreateMeasurementDTO';
import { UpdateMeasurementRequest } from '@/user-interface/dtos/UpdateMeasurementDTO';
import { MeasurementFilters } from '@/user-interface/dtos/MeasurementFiltersDTO';
import { DailyAverageResult, DailyTemperaturePoint, HourlyTemperaturePoint, RepositoryMeasurementFilters, WeeklyAverageResult } from '@/infrastructure/types';
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

  async getDailyAverageByStationId(stationId: string): Promise<DailyAverageResult | null> {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);

    const hourlyRaw = await this.climateMeasurementRepository.getHourlyTemperaturesByStationId(stationId, from);
    if (hourlyRaw.length === 0) return null;

    const dataMap = new Map(hourlyRaw.map((p) => [p.hourStart.getTime(), p.averageTemperature]));

    const firstSlot = new Date(from);
    firstSlot.setMinutes(0, 0, 0);

    const data: HourlyTemperaturePoint[] = Array.from({ length: 24 }, (_, i) => {
      const slotTime = new Date(firstSlot.getTime() + i * 3600000);
      return {
        time: slotTime.toISOString(),
        temperature: dataMap.get(slotTime.getTime()) ?? null,
      };
    });

    const values = hourlyRaw.map((p) => p.averageTemperature);
    const averageTemperature = values.reduce((sum, v) => sum + v, 0) / values.length;

    return { stationId, averageTemperature, from, to, data };
  }

  async getWeeklyTemperatureAverageByStationId(stationId: string): Promise<WeeklyAverageResult | null> {
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dailyRaw = await this.climateMeasurementRepository.getWeeklyAverageTemperatureByStationId(stationId, from);
    if (dailyRaw.length === 0) return null;

    const dataMap = new Map(dailyRaw.map((p) => [p.dayStart.getTime(), p.averageTemperature]));

    const firstSlot = new Date(from);
    firstSlot.setUTCHours(0, 0, 0, 0);

    const data: DailyTemperaturePoint[] = Array.from({ length: 7 }, (_, i) => {
      const slotTime = new Date(firstSlot.getTime() + i * 86400000);
      return {
        date: slotTime.toISOString(),
        temperature: dataMap.get(slotTime.getTime()) ?? null,
      };
    });

    const values = dailyRaw.map((p) => p.averageTemperature);
    const averageTemperature = values.reduce((sum, v) => sum + v, 0) / values.length;

    return { stationId, averageTemperature, from, to, data };
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

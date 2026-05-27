import crypto from 'crypto';
import { WeatherStation, Location, StationStatusType } from '@/domain';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { IStationEventPublisher } from '@/infrastructure/ports/IStationEventPublisher';
import { WeatherStationPort } from '@/user-interface/ports/WeatherStationPort';
import { CreateWeatherStationRequest } from '@/user-interface/dtos/CreateWeatherStationDTO';
import { UpdateWeatherStationRequest } from '@/user-interface/dtos/UpdateWeatherStationDTO';

export class WeatherStationService implements WeatherStationPort {
  constructor(
    private readonly weatherStationRepository: IWeatherStationRepository,
    private readonly userRepository: IUserRepository,
    private readonly stationEventPublisher: IStationEventPublisher,
  ) {}

  async getStationById(id: string): Promise<WeatherStation | null> {
    return this.weatherStationRepository.findById(id);
  }

  async getAllStations(): Promise<WeatherStation[]> {
    return this.weatherStationRepository.getAll();
  }

  async updateWeatherStation(id: string, dto: UpdateWeatherStationRequest): Promise<WeatherStation> {
    const existing = await this.weatherStationRepository.findById(id);
    if (!existing) {
      const error = new Error('Weather station not found');
      (error as any).statusCode = 404;
      throw error;
    }
    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.weatherStationRepository.findStationByName(dto.name);
      if (nameTaken) {
        const error = new Error('A weather station with that name already exists');
        (error as any).statusCode = 409;
        throw error;
      }
    }
    const updated = WeatherStation.create(
      existing.id,
      dto.name ?? existing.name,
      dto.location
        ? Location.create(dto.location.latitude, dto.location.longitude)
        : existing.location,
      dto.model ?? existing.sensorModel,
      dto.status ?? existing.status,
      existing.ownerId,
    );
    await this.weatherStationRepository.update(id, updated);
    await this.stationEventPublisher.publishStationUpdated(updated);
    return updated;
  }

  async deleteStation(id: string): Promise<void> {
    const existing = await this.weatherStationRepository.findById(id);
    if (!existing) {
      const error = new Error('Weather station not found');
      (error as any).statusCode = 404;
      throw error;
    }

    await this.weatherStationRepository.remove(id);
    await this.stationEventPublisher.publishStationDeleted(id);
  }

  async searchByName(name: string): Promise<WeatherStation | null> {
    return this.weatherStationRepository.findStationByName(name);
  }

  async createWeatherStation(dto: CreateWeatherStationRequest): Promise<WeatherStation> {
    const owner = await this.userRepository.findById(dto.ownerId);
    if (!owner) {
      const error = new Error('Owner not found');
      (error as any).statusCode = 404;
      throw error;
    }
    const existing = await this.weatherStationRepository.findStationByName(dto.name);
    if (existing) {
      const error = new Error('A weather station with that name already exists');
      (error as any).statusCode = 409;
      throw error;
    }
    const id = crypto.randomUUID();
    const station = WeatherStation.create(
      id,
      dto.name,
      Location.create(dto.location.latitude, dto.location.longitude),
      dto.model,
      StationStatusType.ACTIVE,
      dto.ownerId,
    );
    await this.weatherStationRepository.save(station);
    await this.stationEventPublisher.publishStationCreated(station);
    return station;
  }
}

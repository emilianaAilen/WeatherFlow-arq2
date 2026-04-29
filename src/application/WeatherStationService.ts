import crypto from 'crypto';
import { WeatherStation, Location, StationStatusType } from '@/domain';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { WeatherStationPort } from '@/user-interface/ports/WeatherStationPort';
import { CreateWeatherStationRequest } from '@/user-interface/dtos/CreateWeatherStationDTO';

export class WeatherStationService implements WeatherStationPort {
  constructor(
    private readonly weatherStationRepository: IWeatherStationRepository,
    private readonly userRepository: IUserRepository,
  ) {}

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
    return station;
  }
}

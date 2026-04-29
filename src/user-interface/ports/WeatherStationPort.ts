import { WeatherStation } from '@/domain';
import { CreateWeatherStationRequest } from '@/user-interface/dtos/CreateWeatherStationDTO';

export interface WeatherStationPort {
  createWeatherStation(dto: CreateWeatherStationRequest): Promise<WeatherStation>;
}

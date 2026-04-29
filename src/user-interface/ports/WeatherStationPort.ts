import { WeatherStation } from '@/domain';
import { CreateWeatherStationRequest } from '@/user-interface/dtos/CreateWeatherStationDTO';
import { UpdateWeatherStationRequest } from '@/user-interface/dtos/UpdateWeatherStationDTO';

export interface WeatherStationPort {
  createWeatherStation(dto: CreateWeatherStationRequest): Promise<WeatherStation>;
  updateWeatherStation(id: string, dto: UpdateWeatherStationRequest): Promise<WeatherStation>;
}

import { WeatherStation } from '@/domain';

export interface IWeatherStationRepository {
  save(station: WeatherStation): Promise<void>;
  findById(id: string): Promise<WeatherStation | null>;
  update(id: string, station: WeatherStation): Promise<void>;
  remove(id: string): Promise<void>;
  findStationByOwner(id: string): Promise<WeatherStation | null>;
  findStationByName(name: string): Promise<WeatherStation | null>;
  getAll(): Promise<WeatherStation[]>;
}

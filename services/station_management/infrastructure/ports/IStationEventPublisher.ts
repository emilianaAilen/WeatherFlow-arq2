import { WeatherStation } from '@/domain';

export interface IStationEventPublisher {
  publishStationCreated(station: WeatherStation): Promise<void>;
  publishStationUpdated(station: WeatherStation): Promise<void>;
  publishStationDeleted(stationId: string): Promise<void>;
}

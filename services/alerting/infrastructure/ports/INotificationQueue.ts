import { ClimateMeasurement } from '@/domain';

export interface INotificationQueue {
  publish(measurement: ClimateMeasurement): Promise<void>;
}

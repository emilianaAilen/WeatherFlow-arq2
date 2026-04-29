import { ClimateMeasurement } from '@/domain';
import { CreateMeasurementRequest } from '@/user-interface/dtos/CreateMeasurementDTO';

export interface ClimateMeasurementPort {
  createMeasurement(dto: CreateMeasurementRequest): Promise<ClimateMeasurement>;
}

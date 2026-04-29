import { ClimateMeasurement } from '@/domain';
import { CreateMeasurementRequest } from '@/user-interface/dtos/CreateMeasurementDTO';
import { UpdateMeasurementRequest } from '@/user-interface/dtos/UpdateMeasurementDTO';

export interface ClimateMeasurementPort {
  createMeasurement(dto: CreateMeasurementRequest): Promise<ClimateMeasurement>;
  updateMeasurement(id: string, dto: UpdateMeasurementRequest): Promise<ClimateMeasurement>;
  getMeasurementById(id: string): Promise<ClimateMeasurement | null>;
  deleteMeasurement(id: string): Promise<void>;
}

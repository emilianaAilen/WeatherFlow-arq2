import { ClimateMeasurement } from '@/domain';
import { CreateMeasurementRequest } from '@/user-interface/dtos/CreateMeasurementDTO';
import { UpdateMeasurementRequest } from '@/user-interface/dtos/UpdateMeasurementDTO';
import { MeasurementFilters } from '@/user-interface/dtos/MeasurementFiltersDTO';

export interface ClimateMeasurementPort {
  createMeasurement(dto: CreateMeasurementRequest): Promise<ClimateMeasurement>;
  updateMeasurement(id: string, dto: UpdateMeasurementRequest): Promise<ClimateMeasurement>;
  getMeasurementById(id: string): Promise<ClimateMeasurement | null>;
  deleteMeasurement(id: string): Promise<void>;
  search(filters: MeasurementFilters): Promise<ClimateMeasurement[]>;
  getCurrentMeasurementByStationId(stationId: string): Promise<ClimateMeasurement | null>;
}

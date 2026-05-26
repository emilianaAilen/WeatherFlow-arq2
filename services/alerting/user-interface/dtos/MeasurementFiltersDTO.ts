import { z } from 'zod';

export interface MeasurementFilters {
  stationName?: string;
  minTemperature?: number;
  maxTemperature?: number;
  minHumidity?: number;
  maxHumidity?: number;
  minPressure?: number;
  maxPressure?: number;
  isActiveAlert?: boolean;
}

export const MeasurementFiltersQuerySchema = z.object({
  station: z.string().optional(),
  min_temperature: z.coerce.number().optional(),
  max_temperature: z.coerce.number().optional(),
  min_humidity: z.coerce.number().optional(),
  max_humidity: z.coerce.number().optional(),
  min_pressure: z.coerce.number().optional(),
  max_pressure: z.coerce.number().optional(),
  alert_status: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

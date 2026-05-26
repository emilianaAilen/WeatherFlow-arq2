import { z } from 'zod';

export interface MeasurementFilters {
  stationName?: string;
  minTemperature?: number;
  maxTemperature?: number;
  isActiveAlert?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export const MeasurementFiltersQuerySchema = z.object({
  station: z.string().optional(),
  min_temperature: z.coerce.number().optional(),
  max_temperature: z.coerce.number().optional(),
  alert_status: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});

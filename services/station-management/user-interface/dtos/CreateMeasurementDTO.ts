import { z } from 'zod';

export interface CreateMeasurementRequest {
  temperature: number;
  humidity: number;
  atmosphericPressure: number;
  stationId: string;
}

export const CreateMeasurementSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  atmosphericPressure: z.number(),
  stationId: z.uuid('stationId must be a valid UUID'),
});

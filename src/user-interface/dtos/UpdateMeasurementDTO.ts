import { z } from 'zod';

export interface UpdateMeasurementRequest {
  temperature?: number;
  humidity?: number;
  atmosphericPressure?: number;
}

export const UpdateMeasurementSchema = z
  .object({
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    atmosphericPressure: z.number().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

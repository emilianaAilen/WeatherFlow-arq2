import { z } from 'zod';

export const createMeasurementSchema = z.object({
  temperature: z.coerce.number(),
  humidity: z.coerce.number().min(0, 'Humidity must be ≥ 0').max(100, 'Humidity must be ≤ 100'),
  atmosphericPressure: z.coerce.number(),
  stationId: z.string().uuid('Must be a valid station UUID'),
});

export const updateMeasurementSchema = z
  .object({
    temperature: z.coerce.number().optional(),
    humidity: z.coerce
      .number()
      .min(0, 'Humidity must be ≥ 0')
      .max(100, 'Humidity must be ≤ 100')
      .optional(),
    atmosphericPressure: z.coerce.number().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

export type CreateMeasurementFormData = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementFormData = z.infer<typeof updateMeasurementSchema>;

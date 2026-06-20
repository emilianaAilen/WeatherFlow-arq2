import { z } from 'zod';

export const stationFormSchema = z.object({
  name: z.string().min(1, 'Station name is required'),
  model: z.string().min(1, 'Sensor model is required'),
  ownerId: z.string().optional(),
  latitude: z.coerce.number().min(-90, 'Latitude must be ≥ -90').max(90, 'Latitude must be ≤ 90'),
  longitude: z.coerce.number().min(-180, 'Longitude must be ≥ -180').max(180, 'Longitude must be ≤ 180'),
  status: z.enum(['Active', 'Inactive']).optional(),
  receivesExternalData: z.boolean().optional().default(false),
});

export const createStationSchema = stationFormSchema;
export const updateStationSchema = stationFormSchema.partial();

export type StationFormData = z.infer<typeof stationFormSchema>;
export type CreateStationFormData = StationFormData;
export type UpdateStationFormData = z.infer<typeof updateStationSchema>;

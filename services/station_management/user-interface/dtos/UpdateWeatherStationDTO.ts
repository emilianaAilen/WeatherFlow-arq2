import { z } from 'zod';
import { StationStatusType } from '@/domain';

export interface UpdateWeatherStationRequest {
  name?: string;
  location?: { latitude: number; longitude: number };
  model?: string;
  status?: StationStatusType;
  receivesExternalData?: boolean;
}

export const UpdateWeatherStationSchema = z
  .object({
    name: z.string().min(1, 'Name must not be empty').optional(),
    location: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
    model: z.string().min(1, 'Model must not be empty').optional(),
    status: z.enum([StationStatusType.ACTIVE, StationStatusType.INACTIVE]).optional(),
    receivesExternalData: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

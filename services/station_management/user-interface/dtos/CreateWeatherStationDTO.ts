import { z } from 'zod';

export interface CreateWeatherStationRequest {
  name: string;
  location: { latitude: number; longitude: number };
  model: string;
  ownerId: string;
  receivesExternalData?: boolean;
}

export const CreateWeatherStationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  model: z.string().min(1, 'Model is required'),
  ownerId: z.uuid('ownerId must be a valid UUID'),
  receivesExternalData: z.boolean().optional().default(false),
});

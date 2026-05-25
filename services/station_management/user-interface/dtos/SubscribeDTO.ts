import { z } from 'zod';

export interface SubscribeRequest {
  weatherStationId: string;
}

export const SubscribeSchema = z.object({
  weatherStationId: z.uuid('Invalid weather station ID format'),
});

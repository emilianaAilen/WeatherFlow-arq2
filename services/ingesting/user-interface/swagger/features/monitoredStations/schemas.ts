import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const MonitoredStationResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    name: z.string().openapi({ example: 'Station Norte' }),
    alertingStationId: z
      .string()
      .uuid()
      .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    latitude: z.number().openapi({ example: -34.6037 }),
    longitude: z.number().openapi({ example: -58.3816 }),
  })
  .openapi('MonitoredStation');

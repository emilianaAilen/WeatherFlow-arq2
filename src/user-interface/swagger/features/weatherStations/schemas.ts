import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

const LocationSchema = z
  .object({
    latitude: z.number().min(-90).max(90).openapi({ example: -34.6 }),
    longitude: z.number().min(-180).max(180).openapi({ example: -58.4 }),
  })
  .openapi('Location');

export const CreateWeatherStationRequestSchema = z
  .object({
    name: z.string().min(1).openapi({ example: 'Station Alpha', description: 'Station name' }),
    location: LocationSchema,
    model: z.string().min(1).openapi({ example: 'ModelX', description: 'Sensor model identifier' }),
    ownerId: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID of the owning user' }),
  })
  .openapi('CreateWeatherStationRequest');

export const WeatherStationResponseSchema = z
  .object({
    id: z.string().openapi({ example: '64b1f2c3e4b0a1b2c3d4e5f6', description: 'Station ID' }),
    name: z.string().openapi({ example: 'Station Alpha' }),
    location: LocationSchema,
    sensorModel: z.string().openapi({ example: 'ModelX' }),
    status: z.string().openapi({ example: 'Active' }),
    ownerId: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  })
  .openapi('WeatherStationResponse');

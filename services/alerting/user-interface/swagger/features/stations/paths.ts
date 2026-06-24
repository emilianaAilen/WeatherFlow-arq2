import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { WeeklyAverageResponseSchema } from './schemas';
import { errorResponse } from '../../shared/responses';

export const stationTag = {
  name: 'Stations',
  description: 'Station-level aggregated data',
};

export function registerStationPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/stations/{id}/temperature/average/week',
    summary: 'Get weekly average temperature for a station',
    description: 'Returns the average temperature across all measurements recorded for the given station over the last 7 days.',
    tags: [stationTag.name],
    request: {
      params: z.object({
        id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
      }),
    },
    responses: {
      200: {
        description: 'Weekly average calculated successfully.',
        content: { 'application/json': { schema: WeeklyAverageResponseSchema } },
      },
      400: {
        description: 'The provided id is not a valid UUID.',
        content: {
          'application/json': { schema: errorResponse('Invalid id format — must be a UUID') },
        },
      },
      404: {
        description: 'No measurements found for this station in the last 7 days.',
        content: {
          'application/json': {
            schema: errorResponse('No measurements found for this station in the last 7 days'),
          },
        },
      },
    },
  });
}

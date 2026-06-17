import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { MonitoredStationResponseSchema } from './schemas';
import { errorResponse } from '../../shared/responses';

export const monitoredStationTag = {
  name: 'Monitored Stations',
  description: 'Stations registered to receive external data ingestion',
};

export function registerMonitoredStationPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/monitored-stations',
    summary: 'List all monitored stations',
    description:
      'Returns all weather stations that have been registered for external data ingestion.',
    tags: [monitoredStationTag.name],
    responses: {
      200: {
        description: 'Monitored stations retrieved successfully.',
        content: {
          'application/json': { schema: z.array(MonitoredStationResponseSchema) },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/monitored-stations/{id}',
    summary: 'Get a monitored station by ID',
    description: 'Returns a single monitored station matching the provided UUID.',
    tags: [monitoredStationTag.name],
    request: {
      params: z.object({
        id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
      }),
    },
    responses: {
      200: {
        description: 'Monitored station found.',
        content: { 'application/json': { schema: MonitoredStationResponseSchema } },
      },
      400: {
        description: 'The provided id is not a valid UUID.',
        content: {
          'application/json': { schema: errorResponse('Invalid id format — must be a UUID') },
        },
      },
      404: {
        description: 'No monitored station exists with the given id.',
        content: {
          'application/json': {
            schema: errorResponse('Monitored station with id <id> not found'),
          },
        },
      },
    },
  });
}

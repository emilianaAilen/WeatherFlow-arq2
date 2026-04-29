import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateWeatherStationRequestSchema, UpdateWeatherStationRequestSchema, WeatherStationResponseSchema } from './schemas';
import { errorResponse, validationErrorResponse } from '../../shared/responses';

export const weatherStationTag = { name: 'Weather Stations', description: 'Weather station management' };

export function registerWeatherStationPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/weatherStations',
    summary: 'List all weather stations',
    description: 'Returns the full list of registered weather stations.',
    tags: [weatherStationTag.name],
    responses: {
      200: {
        description: 'Weather stations retrieved successfully.',
        content: { 'application/json': { schema: z.array(WeatherStationResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/weatherStations/{id}',
    summary: 'Get a weather station by ID',
    description: 'Returns a single weather station matching the provided UUID.',
    tags: [weatherStationTag.name],
    request: {
      params: z.object({ id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }) }),
    },
    responses: {
      200: {
        description: 'Weather station found.',
        content: { 'application/json': { schema: WeatherStationResponseSchema } },
      },
      400: {
        description: 'The provided id is not a valid UUID.',
        content: { 'application/json': { schema: errorResponse('Invalid id format — must be a UUID') } },
      },
      404: {
        description: 'No weather station exists with the given id.',
        content: { 'application/json': { schema: errorResponse('Weather station not found') } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/weatherStations/{id}',
    summary: 'Delete a weather station',
    description: 'Permanently removes a weather station. Fails if the station has associated climate measurements.',
    tags: [weatherStationTag.name],
    request: {
      params: z.object({ id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }) }),
    },
    responses: {
      204: { description: 'Weather station deleted successfully.' },
      400: {
        description: 'The provided id is not a valid UUID.',
        content: { 'application/json': { schema: errorResponse('Invalid id format — must be a UUID') } },
      },
      404: {
        description: 'Weather station not found.',
        content: { 'application/json': { schema: errorResponse('Weather station not found') } },
      },
      409: {
        description: 'Weather station has associated measurements and cannot be deleted.',
        content: { 'application/json': { schema: errorResponse('Weather station has associated measurements and cannot be deleted') } },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/weatherStations/{id}',
    summary: 'Update a weather station',
    description: 'Partially updates a weather station. At least one field must be provided. Name must remain unique.',
    tags: [weatherStationTag.name],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: UpdateWeatherStationRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Weather station updated successfully.',
        content: { 'application/json': { schema: WeatherStationResponseSchema } },
      },
      400: {
        description: 'Invalid UUID or request body failed validation.',
        content: { 'application/json': { schema: validationErrorResponse('status', 'Invalid enum value') } },
      },
      404: {
        description: 'Weather station not found.',
        content: { 'application/json': { schema: errorResponse('Weather station not found') } },
      },
      409: {
        description: 'A weather station with that name already exists.',
        content: { 'application/json': { schema: errorResponse('A weather station with that name already exists') } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/weatherStations',
    summary: 'Create a new weather station',
    description: 'Registers a new weather station. The name must be unique. The owner must exist. Status defaults to Active.',
    tags: [weatherStationTag.name],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: CreateWeatherStationRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Weather station created successfully.',
        content: { 'application/json': { schema: WeatherStationResponseSchema } },
      },
      400: {
        description: 'Request body failed validation.',
        content: { 'application/json': { schema: validationErrorResponse('location.latitude', 'Must be between -90 and 90') } },
      },
      404: {
        description: 'The specified owner does not exist.',
        content: { 'application/json': { schema: errorResponse('Owner not found') } },
      },
      409: {
        description: 'A weather station with that name already exists.',
        content: { 'application/json': { schema: errorResponse('A weather station with that name already exists') } },
      },
    },
  });
}

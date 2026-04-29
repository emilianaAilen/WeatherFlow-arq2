import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { CreateWeatherStationRequestSchema, UpdateWeatherStationRequestSchema, WeatherStationResponseSchema } from './schemas';
import { errorResponse, validationErrorResponse } from '../../shared/responses';

export const weatherStationTag = { name: 'Weather Stations', description: 'Weather station management' };

export function registerWeatherStationPaths(registry: OpenAPIRegistry): void {
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

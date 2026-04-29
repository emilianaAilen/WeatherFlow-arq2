import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateMeasurementRequestSchema, UpdateMeasurementRequestSchema, ClimateMeasurementResponseSchema } from './schemas';
import { errorResponse, validationErrorResponse } from '../../shared/responses';

export const measurementTag = { name: 'Measurements', description: 'Climate measurement management' };

export function registerMeasurementPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/measurements/{id}',
    summary: 'Get a climate measurement by ID',
    description: 'Returns a single climate measurement matching the provided UUID.',
    tags: [measurementTag.name],
    request: {
      params: z.object({ id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }) }),
    },
    responses: {
      200: {
        description: 'Measurement found.',
        content: { 'application/json': { schema: ClimateMeasurementResponseSchema } },
      },
      400: {
        description: 'The provided id is not a valid UUID.',
        content: { 'application/json': { schema: errorResponse('Invalid id format — must be a UUID') } },
      },
      404: {
        description: 'No climate measurement exists with the given id.',
        content: { 'application/json': { schema: errorResponse('Climate measurement not found') } },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/measurements/{id}',
    summary: 'Update a climate measurement',
    description: 'Partially updates a measurement. dateTime is reset to now and the alert is recalculated from the new values.',
    tags: [measurementTag.name],
    request: {
      params: z.object({ id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }) }),
      body: {
        required: true,
        content: { 'application/json': { schema: UpdateMeasurementRequestSchema } },
      },
    },
    responses: {
      200: {
        description: 'Measurement updated successfully.',
        content: { 'application/json': { schema: ClimateMeasurementResponseSchema } },
      },
      400: {
        description: 'Invalid UUID or request body failed validation.',
        content: { 'application/json': { schema: validationErrorResponse('temperature', 'Expected number, received string') } },
      },
      404: {
        description: 'Climate measurement not found.',
        content: { 'application/json': { schema: errorResponse('Climate measurement not found') } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/measurements',
    summary: 'Create a new climate measurement',
    description: 'Records a new climate measurement for a weather station. Alert type is calculated automatically from the provided values.',
    tags: [measurementTag.name],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: CreateMeasurementRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'Measurement recorded successfully.',
        content: { 'application/json': { schema: ClimateMeasurementResponseSchema } },
      },
      400: {
        description: 'Request body failed validation.',
        content: { 'application/json': { schema: validationErrorResponse('temperature', 'Expected number, received string') } },
      },
      404: {
        description: 'The specified weather station does not exist.',
        content: { 'application/json': { schema: errorResponse('Weather station not found') } },
      },
    },
  });
}

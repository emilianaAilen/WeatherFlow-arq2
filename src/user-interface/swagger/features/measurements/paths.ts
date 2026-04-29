import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { CreateMeasurementRequestSchema, ClimateMeasurementResponseSchema } from './schemas';
import { errorResponse, validationErrorResponse } from '../../shared/responses';

export const measurementTag = { name: 'Measurements', description: 'Climate measurement management' };

export function registerMeasurementPaths(registry: OpenAPIRegistry): void {
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

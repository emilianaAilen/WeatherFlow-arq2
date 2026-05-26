import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const CreateMeasurementRequestSchema = z
  .object({
    temperature: z.number().openapi({ example: 25.4, description: 'Temperature in °C' }),
    humidity: z.number().openapi({ example: 60, description: 'Relative humidity in %' }),
    atmosphericPressure: z.number().openapi({ example: 1013, description: 'Atmospheric pressure in hPa' }),
    stationId: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'UUID of the weather station' }),
  })
  .openapi('CreateMeasurementRequest');

export const UpdateMeasurementRequestSchema = z
  .object({
    temperature: z.number().optional().openapi({ example: 30.1, description: 'Temperature in °C' }),
    humidity: z.number().optional().openapi({ example: 75, description: 'Relative humidity in %' }),
    atmosphericPressure: z.number().optional().openapi({ example: 1005, description: 'Atmospheric pressure in hPa' }),
  })
  .openapi('UpdateMeasurementRequest');

export const MeasurementFiltersQuerySchema = z
  .object({
    station: z.string().optional().openapi({ example: 'station name', description: 'Exact station name (case-insensitive)' }),
    min_temperature: z.number().optional().openapi({ example: 20, description: 'Minimum temperature in °C (inclusive)' }),
    max_temperature: z.number().optional().openapi({ example: 35, description: 'Maximum temperature in °C (inclusive)' }),
    alert_status: z.boolean().optional().openapi({ example: true, description: 'Filter by active alert status' }),
    start_date: z.string().optional().openapi({ example: '2024-01-01T00:00:00.000Z', description: 'Start date in ISO 8601 format (inclusive)' }),
    end_date: z.string().optional().openapi({ example: '2024-01-31T23:59:59.999Z', description: 'End date in ISO 8601 format (inclusive)' }),
  })
  .openapi('MeasurementFiltersQuery');

export const ClimateMeasurementResponseSchema = z
  .object({
    id: z.string().openapi({ example: '64b1f2c3e4b0a1b2c3d4e5f6', description: 'Measurement ID' }),
    temperature: z.object({ value: z.number().openapi({ example: 25.4 }) }),
    humidity: z.object({ value: z.number().openapi({ example: 60 }) }),
    atmosphericPressure: z.object({ value: z.number().openapi({ example: 1013 }) }),
    dateTime: z.string().openapi({ example: '2024-01-01T00:00:00.000Z', description: 'ISO 8601 timestamp' }),
    alert: z.object({
      status: z.boolean().openapi({ example: false }),
      type: z.string().openapi({ example: 'None' }),
    }),
    stationId: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  })
  .openapi('ClimateMeasurementResponse');

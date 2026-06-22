import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const CreateMeasurementRequestSchema = z
  .object({
    temperature: z.number().openapi({ example: 25.4, description: 'Temperature in °C' }),
    humidity: z.number().openapi({ example: 60, description: 'Relative humidity in %' }),
    atmosphericPressure: z
      .number()
      .openapi({ example: 1013, description: 'Atmospheric pressure in hPa' }),
    stationId: z.uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'UUID of the weather station',
    }),
  })
  .openapi('CreateMeasurementRequest');

export const UpdateMeasurementRequestSchema = z
  .object({
    temperature: z.number().optional().openapi({ example: 30.1, description: 'Temperature in °C' }),
    humidity: z.number().optional().openapi({ example: 75, description: 'Relative humidity in %' }),
    atmosphericPressure: z
      .number()
      .optional()
      .openapi({ example: 1005, description: 'Atmospheric pressure in hPa' }),
  })
  .openapi('UpdateMeasurementRequest');

export const MeasurementFiltersQuerySchema = z
  .object({
    station: z
      .string()
      .optional()
      .openapi({ example: 'station name', description: 'Exact station name (case-insensitive)' }),
    min_temperature: z
      .number()
      .optional()
      .openapi({ example: 20, description: 'Minimum temperature in °C (inclusive)' }),
    max_temperature: z
      .number()
      .optional()
      .openapi({ example: 35, description: 'Maximum temperature in °C (inclusive)' }),
    min_humidity: z
      .number()
      .optional()
      .openapi({ example: 40, description: 'Minimum relative humidity in % (inclusive)' }),
    max_humidity: z
      .number()
      .optional()
      .openapi({ example: 80, description: 'Maximum relative humidity in % (inclusive)' }),
    min_pressure: z
      .number()
      .optional()
      .openapi({ example: 1000, description: 'Minimum atmospheric pressure in hPa (inclusive)' }),
    max_pressure: z
      .number()
      .optional()
      .openapi({ example: 1020, description: 'Maximum atmospheric pressure in hPa (inclusive)' }),
    alert_status: z
      .boolean()
      .optional()
      .openapi({ example: true, description: 'Filter by active alert status' }),
  })
  .openapi('MeasurementFiltersQuery');

export const DailyAverageResponseSchema = z
  .object({
    stationId: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    averageTemperature: z.number().openapi({ example: 22.4, description: 'Overall average temperature in °C across the last 24 hours' }),
    from: z.string().openapi({ example: '2024-01-01T00:00:00.000Z', description: 'Start of the 24-hour window (ISO 8601)' }),
    to: z.string().openapi({ example: '2024-01-02T00:00:00.000Z', description: 'End of the 24-hour window (ISO 8601)' }),
    data: z.array(
      z.object({
        time: z.string().openapi({ example: '2024-01-01T14:00:00.000Z', description: 'Hour slot start (ISO 8601 UTC)' }),
        temperature: z.number().nullable().openapi({ example: 22.4, description: 'Average temperature in °C for this hour, or null if no data' }),
      }),
    ).openapi({ description: '24 hourly data points ready for a Recharts LineChart' }),
  })
  .openapi('DailyAverageResponse');

export const ClimateMeasurementResponseSchema = z
  .object({
    id: z.string().openapi({ example: '64b1f2c3e4b0a1b2c3d4e5f6', description: 'Measurement ID' }),
    temperature: z.object({ value: z.number().openapi({ example: 25.4 }) }),
    humidity: z.object({ value: z.number().openapi({ example: 60 }) }),
    atmosphericPressure: z.object({ value: z.number().openapi({ example: 1013 }) }),
    dateTime: z
      .string()
      .openapi({ example: '2024-01-01T00:00:00.000Z', description: 'ISO 8601 timestamp' }),
    alert: z.object({
      status: z.boolean().openapi({ example: false }),
      type: z.string().openapi({ example: 'None' }),
    }),
    stationId: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  })
  .openapi('ClimateMeasurementResponse');

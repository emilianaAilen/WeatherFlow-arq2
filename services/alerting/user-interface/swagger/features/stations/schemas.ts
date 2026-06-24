import { z } from 'zod';
import { errorResponse } from '../../shared/responses';

export { errorResponse };

export const WeeklyAverageResponseSchema = z
  .object({
    stationId: z.string().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    averageTemperature: z.number().openapi({ example: 21.8, description: 'Overall average temperature in °C across the last 7 days' }),
    from: z.string().openapi({ example: '2024-01-01T00:00:00.000Z', description: 'Start of the 7-day window (ISO 8601)' }),
    to: z.string().openapi({ example: '2024-01-08T00:00:00.000Z', description: 'End of the 7-day window (ISO 8601)' }),
    data: z.array(
      z.object({
        date: z.string().openapi({ example: '2024-01-01T00:00:00.000Z', description: 'Day start in UTC (ISO 8601)' }),
        temperature: z.number().nullable().openapi({ example: 21.8, description: 'Average temperature in °C for this day, or null if no data' }),
      }),
    ).openapi({ description: '7 daily data points ready for a Recharts LineChart' }),
  })
  .openapi('WeeklyAverageResponse');

import { MeasurementFiltersQuerySchema } from './MeasurementFiltersDTO';

describe('MeasurementFiltersQuerySchema', () => {
  it('should parse valid dates correctly', () => {
    const result = MeasurementFiltersQuerySchema.safeParse({
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2024-01-31T23:59:59Z',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.start_date).toBeInstanceOf(Date);
      expect(result.data.end_date).toBeInstanceOf(Date);
      expect(result.data.start_date?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(result.data.end_date?.toISOString()).toBe('2024-01-31T23:59:59.000Z');
    }
  });

  it('should return error for invalid dates', () => {
    const result = MeasurementFiltersQuerySchema.safeParse({
      start_date: 'invalid-date',
    });

    expect(result.success).toBe(false);
  });

  it('should handle missing optional dates', () => {
    const result = MeasurementFiltersQuerySchema.safeParse({
      station: 'Test Station',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.start_date).toBeUndefined();
      expect(result.data.end_date).toBeUndefined();
    }
  });
});

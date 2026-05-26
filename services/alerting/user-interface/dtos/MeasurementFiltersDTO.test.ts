import { MeasurementFiltersQuerySchema } from './MeasurementFiltersDTO';

describe('MeasurementFiltersQuerySchema', () => {
  it('should parse valid climate parameters correctly', () => {
    const result = MeasurementFiltersQuerySchema.safeParse({
      min_humidity: '40',
      max_pressure: '1020',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.min_humidity).toBe(40);
      expect(result.data.max_pressure).toBe(1020);
    }
  });

  it('should return error for invalid numeric formats', () => {
    const result = MeasurementFiltersQuerySchema.safeParse({
      min_humidity: 'invalid-number',
    });

    expect(result.success).toBe(false);
  });

  it('should handle missing optional dates and params', () => {
    const result = MeasurementFiltersQuerySchema.safeParse({
      station: 'Test Station',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.min_humidity).toBeUndefined();
    }
  });
});

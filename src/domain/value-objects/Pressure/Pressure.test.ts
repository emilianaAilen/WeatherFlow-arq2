import { describe, expect, it } from '@jest/globals';
import { Pressure } from './Pressure';

describe('Pressure', () => {
  describe('isLowPressure', () => {
    it('returns true when pressure is below 980 hPa', () => {
      expect(Pressure.create(979).isLowPressure()).toBe(true);
    });

    it('returns false when pressure is exactly 980 hPa', () => {
      expect(Pressure.create(980).isLowPressure()).toBe(false);
    });

    it('returns false when pressure is above 980 hPa', () => {
      expect(Pressure.create(1013).isLowPressure()).toBe(false);
    });
  });
});

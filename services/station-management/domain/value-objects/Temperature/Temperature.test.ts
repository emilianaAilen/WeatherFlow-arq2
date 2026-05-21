import { describe, expect, it } from '@jest/globals';
import { Temperature } from './Temperature';

describe('Temperature', () => {
  describe('isExtremeHeat', () => {
    it('returns true when temperature is above 40°C', () => {
      expect(Temperature.create(41).isExtremeHeat()).toBe(true);
    });

    it('returns false when temperature is exactly 40°C', () => {
      expect(Temperature.create(40).isExtremeHeat()).toBe(false);
    });

    it('returns false when temperature is below 40°C', () => {
      expect(Temperature.create(25).isExtremeHeat()).toBe(false);
    });
  });

  describe('isFrost', () => {
    it('returns true when temperature is below 0°C', () => {
      expect(Temperature.create(-1).isFrost()).toBe(true);
    });

    it('returns false when temperature is exactly 0°C', () => {
      expect(Temperature.create(0).isFrost()).toBe(false);
    });

    it('returns false when temperature is above 0°C', () => {
      expect(Temperature.create(20).isFrost()).toBe(false);
    });
  });
});

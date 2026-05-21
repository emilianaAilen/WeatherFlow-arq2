import { describe, expect, it } from '@jest/globals';
import { Humidity } from './Humidity';

describe('Humidity', () => {
  describe('isCritical', () => {
    it('returns true when humidity is above 90%', () => {
      expect(Humidity.create(91).isCritical()).toBe(true);
    });

    it('returns false when humidity is exactly 90%', () => {
      expect(Humidity.create(90).isCritical()).toBe(false);
    });

    it('returns false when humidity is below 90%', () => {
      expect(Humidity.create(60).isCritical()).toBe(false);
    });
  });
});

import { describe, expect, it } from '@jest/globals';
import { Location } from './Location';

describe('Location', () => {
  it('returns latitude when called', () => {
    expect(Location.create(40.7128, -74.006).getLatitude()).toBe(40.7128);
  });

  it('returns longitude when called', () => {
    expect(Location.create(40.7128, -74.006).getLongitude()).toBe(-74.006);
  });
});

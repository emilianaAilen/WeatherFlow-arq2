import { describe, expect, it } from '@jest/globals';
import { WeatherStation } from './WeatherStation';
import { Location } from '../../value-objects/Location';
import { StationStatusType } from '../../types';

const location = Location.create(-34.6, -58.4);

function createStation(status: StationStatusType = StationStatusType.ACTIVE) {
  return WeatherStation.create('id-1', 'Station Alpha', location, 'ModelX', status, 'owner-1');
}

describe('WeatherStation', () => {
  it('returns correct name', () => {
    expect(createStation().getName()).toBe('Station Alpha');
  });

  it('returns correct location', () => {
    const station = createStation();
    expect(station.getLocation().latitude).toBe(-34.6);
    expect(station.getLocation().longitude).toBe(-58.4);
  });

  it('returns correct sensor model', () => {
    expect(createStation().getSensorModel()).toBe('ModelX');
  });

  it('returns correct owner ID', () => {
    expect(createStation().getOwnerId()).toBe('owner-1');
  });

  it('returns Active status', () => {
    expect(createStation(StationStatusType.ACTIVE).getStatus()).toBe(StationStatusType.ACTIVE);
  });

  it('returns Inactive status', () => {
    expect(createStation(StationStatusType.INACTIVE).getStatus()).toBe(StationStatusType.INACTIVE);
  });
});

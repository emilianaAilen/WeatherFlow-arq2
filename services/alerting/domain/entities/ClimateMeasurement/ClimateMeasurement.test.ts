import { describe, expect, it } from '@jest/globals';
import { ClimateMeasurement } from './ClimateMeasurement';
import { AlertType } from '../../types';

const DATE = new Date('2024-01-01T00:00:00Z');
const STATION_ID = 'station-1';

function createMeasurement(temperature: number, humidity: number, pressure: number) {
  return ClimateMeasurement.create('id-1', temperature, humidity, pressure, DATE, STATION_ID);
}

describe('ClimateMeasurement', () => {
  it('creates a measurement with no alert when values are within normal range', () => {
    const measurement = createMeasurement(25, 60, 1013);
    expect(measurement.getAlert().isActiveAlert()).toBe(false);
    expect(measurement.getAlert().getType()).toBe(AlertType.NONE);
  });

  it('automatically triggers extreme heat alert when temperature exceeds 40°C', () => {
    const measurement = createMeasurement(41, 60, 1013);
    expect(measurement.getAlert().isActiveAlert()).toBe(true);
    expect(measurement.getAlert().getType()).toBe(AlertType.EXTREME_HEAT);
  });

  it('automatically triggers frost alert when temperature is below 0°C', () => {
    const measurement = createMeasurement(-1, 60, 1013);
    expect(measurement.getAlert().isActiveAlert()).toBe(true);
    expect(measurement.getAlert().getType()).toBe(AlertType.FROST);
  });

  it('automatically triggers storm alert when pressure is below 980 hPa', () => {
    const measurement = createMeasurement(25, 60, 979);
    expect(measurement.getAlert().isActiveAlert()).toBe(true);
    expect(measurement.getAlert().getType()).toBe(AlertType.STORM);
  });

  it('automatically triggers critical humidity alert when humidity exceeds 90%', () => {
    const measurement = createMeasurement(25, 91, 1013);
    expect(measurement.getAlert().isActiveAlert()).toBe(true);
    expect(measurement.getAlert().getType()).toBe(AlertType.CRITICAL_HUMIDITY);
  });
});

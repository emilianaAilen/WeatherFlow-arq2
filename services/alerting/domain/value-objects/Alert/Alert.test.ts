import { describe, expect, it } from '@jest/globals';
import { Alert } from './Alert';
import { Temperature } from '../Temperature';
import { Humidity } from '../Humidity';
import { Pressure } from '../Pressure';
import { AlertType } from '../../types';

const NORMAL_MOCK_VALUES = {
  temperature: Temperature.create(25),
  humidity: Humidity.create(60),
  pressure: Pressure.create(1013),
};

describe('Alert', () => {
  describe('fromValues', () => {
    it('returns no alert when all values are within normal range', () => {
      const alert = Alert.fromValues(
        NORMAL_MOCK_VALUES.temperature,
        NORMAL_MOCK_VALUES.humidity,
        NORMAL_MOCK_VALUES.pressure,
      );
      expect(alert.isActiveAlert()).toBe(false);
      expect(alert.getType()).toBe(AlertType.NONE);
    });

    it('triggers extreme heat alert when temperature exceeds 40°C', () => {
      const alert = Alert.fromValues(
        Temperature.create(41),
        NORMAL_MOCK_VALUES.humidity,
        NORMAL_MOCK_VALUES.pressure,
      );
      expect(alert.isActiveAlert()).toBe(true);
      expect(alert.getType()).toBe(AlertType.EXTREME_HEAT);
    });

    it('triggers frost alert when temperature is below 0°C', () => {
      const alert = Alert.fromValues(
        Temperature.create(-1),
        NORMAL_MOCK_VALUES.humidity,
        NORMAL_MOCK_VALUES.pressure,
      );
      expect(alert.isActiveAlert()).toBe(true);
      expect(alert.getType()).toBe(AlertType.FROST);
    });

    it('triggers storm alert when pressure is below 980 hPa', () => {
      const alert = Alert.fromValues(
        NORMAL_MOCK_VALUES.temperature,
        NORMAL_MOCK_VALUES.humidity,
        Pressure.create(979),
      );
      expect(alert.isActiveAlert()).toBe(true);
      expect(alert.getType()).toBe(AlertType.STORM);
    });

    it('triggers critical humidity alert when humidity exceeds 90%', () => {
      const alert = Alert.fromValues(
        NORMAL_MOCK_VALUES.temperature,
        Humidity.create(91),
        NORMAL_MOCK_VALUES.pressure,
      );
      expect(alert.isActiveAlert()).toBe(true);
      expect(alert.getType()).toBe(AlertType.CRITICAL_HUMIDITY);
    });

    it('prioritises extreme heat over other conditions', () => {
      const alert = Alert.fromValues(
        Temperature.create(41),
        Humidity.create(91),
        Pressure.create(970),
      );
      expect(alert.getType()).toBe(AlertType.EXTREME_HEAT);
    });

    it('prioritises frost over pressure and humidity', () => {
      const alert = Alert.fromValues(
        Temperature.create(-5),
        Humidity.create(91),
        Pressure.create(970),
      );
      expect(alert.getType()).toBe(AlertType.FROST);
    });

    it('prioritises storm over critical humidity', () => {
      const alert = Alert.fromValues(
        NORMAL_MOCK_VALUES.temperature,
        Humidity.create(91),
        Pressure.create(970),
      );
      expect(alert.getType()).toBe(AlertType.STORM);
    });
  });

  describe('none', () => {
    it('creates an inactive alert with type None', () => {
      const alert = Alert.none();
      expect(alert.isActiveAlert()).toBe(false);
      expect(alert.getType()).toBe(AlertType.NONE);
    });
  });
});

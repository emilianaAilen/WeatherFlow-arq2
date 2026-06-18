import { MonitoredStation } from './MonitoredStation';

describe('MonitoredStation', () => {
  describe('create', () => {
    it('should create a station with all fields correctly assigned', () => {
      const station = MonitoredStation.create('station-1', 'Station Norte', -34.6037, -58.3816);

      expect(station.id).toBe('station-1');
      expect(station.name).toBe('Station Norte');
      expect(station.alertingStationId).toBe('station-1');
      expect(station.latitude).toBe(-34.6037);
      expect(station.longitude).toBe(-58.3816);
    });

    it('should set alertingStationId equal to id', () => {
      const station = MonitoredStation.create('abc-123', 'Station Sur', 10.5, 20.3);

      expect(station.alertingStationId).toBe(station.id);
    });
  });

  describe('constructor', () => {
    it('should allow different alertingStationId from id', () => {
      const station = new MonitoredStation('ingest-id', 'Station', 'alerting-id', 1.0, 2.0);

      expect(station.id).toBe('ingest-id');
      expect(station.alertingStationId).toBe('alerting-id');
      expect(station.latitude).toBe(1.0);
      expect(station.longitude).toBe(2.0);
    });
  });
});

import { MonitoredStationRepository } from './MonitoredStationRepository';
import { MonitoredStationModel } from '@/infrastructure/database/schemas/MonitoredStationSchema';
import { MonitoredStation } from '@/domain';

jest.mock('@/infrastructure/database/schemas/MonitoredStationSchema');

describe('MonitoredStationRepository', () => {
  let repository: MonitoredStationRepository;

  beforeEach(() => {
    repository = new MonitoredStationRepository();
    jest.clearAllMocks();
  });

  const makeDoc = (overrides = {}) => ({
    _id: 'station-1',
    name: 'Station Norte',
    alertingStationId: 'station-1',
    latitude: -34.6037,
    longitude: -58.3816,
    ...overrides,
  });

  describe('save', () => {
    it('should persist all fields including coordinates', async () => {
      (MonitoredStationModel.create as jest.Mock).mockResolvedValue({});
      const station = MonitoredStation.create('station-1', 'Station Norte', -34.6037, -58.3816);

      await repository.save(station);

      expect(MonitoredStationModel.create).toHaveBeenCalledWith({
        _id: 'station-1',
        name: 'Station Norte',
        alertingStationId: 'station-1',
        latitude: -34.6037,
        longitude: -58.3816,
      });
    });
  });

  describe('findById', () => {
    it('should return a MonitoredStation with all fields when found', async () => {
      const mockExec = jest.fn().mockResolvedValue(makeDoc());
      (MonitoredStationModel.findById as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.findById('station-1');

      expect(result).toBeInstanceOf(MonitoredStation);
      expect(result?.id).toBe('station-1');
      expect(result?.name).toBe('Station Norte');
      expect(result?.latitude).toBe(-34.6037);
      expect(result?.longitude).toBe(-58.3816);
    });

    it('should return null when not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      (MonitoredStationModel.findById as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.findById('does-not-exist');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all stations mapped with coordinates', async () => {
      const docs = [
        makeDoc({ _id: 'station-1', latitude: -34.6037, longitude: -58.3816 }),
        makeDoc({ _id: 'station-2', name: 'Station Sur', latitude: 10.5, longitude: 20.3 }),
      ];
      const mockExec = jest.fn().mockResolvedValue(docs);
      (MonitoredStationModel.find as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].latitude).toBe(-34.6037);
      expect(result[1].latitude).toBe(10.5);
      expect(result[1].longitude).toBe(20.3);
    });

    it('should return empty array when no stations exist', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      (MonitoredStationModel.find as jest.Mock).mockReturnValue({ exec: mockExec });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should pass name and coordinates to findByIdAndUpdate', async () => {
      const mockExec = jest.fn().mockResolvedValue({});
      (MonitoredStationModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ exec: mockExec });

      await repository.update('station-1', 'New Name', 10.5, 20.3);

      expect(MonitoredStationModel.findByIdAndUpdate).toHaveBeenCalledWith('station-1', {
        name: 'New Name',
        latitude: 10.5,
        longitude: 20.3,
      });
    });
  });

  describe('remove', () => {
    it('should call findByIdAndDelete with the correct id', async () => {
      const mockExec = jest.fn().mockResolvedValue({});
      (MonitoredStationModel.findByIdAndDelete as jest.Mock).mockReturnValue({ exec: mockExec });

      await repository.remove('station-1');

      expect(MonitoredStationModel.findByIdAndDelete).toHaveBeenCalledWith('station-1');
    });
  });
});

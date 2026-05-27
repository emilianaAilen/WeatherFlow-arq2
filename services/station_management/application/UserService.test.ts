import { UserService } from './UserService';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { User, WeatherStation, Location, StationStatusType } from '@/domain';
import crypto from 'crypto';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('UserService', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let weatherStationRepository: jest.Mocked<IWeatherStationRepository>;
  let service: UserService;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getAll: jest.fn(),
    };
    weatherStationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findStationByOwner: jest.fn(),
      findStationByName: jest.fn(),
      getAll: jest.fn(),
    };
    service = new UserService(userRepository, weatherStationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      const user = User.create('id', 'Name', 'Surname', 'test@test.com');
      userRepository.findById.mockResolvedValue(user);
      const result = await service.getUserById('id');
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      const result = await service.getUserById('id');
      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return a list of users', async () => {
      const users = [User.create('id', 'Name', 'Surname', 'test@test.com')];
      userRepository.getAll.mockResolvedValue(users);
      const result = await service.getAllUsers();
      expect(result).toEqual(users);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existing = User.create('id', 'Old', 'Surname', 'old@test.com');
      userRepository.findById.mockResolvedValue(existing);
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.updateUser('id', { name: 'New' });
      expect(userRepository.update).toHaveBeenCalled();
      expect(result.name).toBe('New');
    });

    it('should throw 404 if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.updateUser('id', { name: 'New' })).rejects.toThrow('User not found');
    });

    it('should throw 409 if new email is taken', async () => {
      const existing = User.create('id', 'Old', 'Surname', 'old@test.com');
      const otherUser = User.create('id2', 'Other', 'Surname', 'new@test.com');
      userRepository.findById.mockResolvedValue(existing);
      userRepository.findByEmail.mockResolvedValue(otherUser);

      await expect(service.updateUser('id', { email: 'new@test.com' })).rejects.toThrow(
        'User with given email already exists',
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const existing = User.create('id', 'Old', 'Surname', 'old@test.com');
      userRepository.findById.mockResolvedValue(existing);
      weatherStationRepository.findStationByOwner.mockResolvedValue(null);

      await service.deleteUser('id');
      expect(userRepository.remove).toHaveBeenCalledWith('id');
    });

    it('should throw 404 if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.deleteUser('id')).rejects.toThrow('User not found');
    });

    it('should throw 409 if user owns a station', async () => {
      const existing = User.create('id', 'Old', 'Surname', 'old@test.com');
      userRepository.findById.mockResolvedValue(existing);
      const station = WeatherStation.create(
        'sid',
        'Name',
        Location.create(0, 0),
        'Model',
        StationStatusType.ACTIVE,
        'id',
      );
      weatherStationRepository.findStationByOwner.mockResolvedValue(station);

      await expect(service.deleteUser('id')).rejects.toThrow(
        'User owns one or more weather stations and cannot be deleted',
      );
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      (crypto.randomUUID as jest.Mock).mockReturnValue('new-id');

      const result = await service.createUser({ name: 'N', surname: 'S', email: 'test@test.com' });
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('new-id');
    });

    it('should throw 409 if email already exists', async () => {
      const existing = User.create('id', 'Old', 'Surname', 'test@test.com');
      userRepository.findByEmail.mockResolvedValue(existing);

      await expect(
        service.createUser({ name: 'N', surname: 'S', email: 'test@test.com' }),
      ).rejects.toThrow('User with given email already exists');
    });
  });

  describe('subscribe', () => {
    it('should subscribe successfully', async () => {
      const user = User.create('id', 'Old', 'Surname', 'old@test.com');
      const station = WeatherStation.create(
        'sid',
        'Name',
        Location.create(0, 0),
        'Model',
        StationStatusType.ACTIVE,
        'id2',
      );
      userRepository.findById.mockResolvedValue(user);
      weatherStationRepository.findById.mockResolvedValue(station);

      await service.subscribe('id', 'sid');
      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw 404 if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.subscribe('id', 'sid')).rejects.toThrow('User not found');
    });

    it('should throw 404 if station not found', async () => {
      const user = User.create('id', 'Old', 'Surname', 'old@test.com');
      userRepository.findById.mockResolvedValue(user);
      weatherStationRepository.findById.mockResolvedValue(null);

      await expect(service.subscribe('id', 'sid')).rejects.toThrow('Weather station not found');
    });
  });
});

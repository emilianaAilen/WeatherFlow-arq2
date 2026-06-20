import crypto from 'crypto';
import { User, NotFoundError, ConflictError } from '@/domain';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { UserPort } from '@/user-interface/ports/UserPort';
import { CreateUserRequest } from '@/user-interface/dtos/CreateUserDTO';
import { UpdateUserRequest } from '@/user-interface/dtos/UpdateUserDTO';
import { logger } from '@/infrastructure/logger';

export class UserService implements UserPort {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly weatherStationRepository: IWeatherStationRepository,
  ) {}

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.getAll();
  }

  async updateUser(id: string, dto: UpdateUserRequest): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }
    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(dto.email);
      if (emailTaken) {
        throw new ConflictError('User with given email already exists');
      }
    }
    const updated = User.create(
      existing.id,
      dto.name ?? existing.name,
      dto.surname ?? existing.surname,
      dto.email ?? existing.email,
      existing.subscriptions,
    );
    await this.userRepository.update(id, updated);
    logger.info({ userId: id }, 'User updated');
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }
    const ownedStation = await this.weatherStationRepository.findStationByOwner(id);
    if (ownedStation) {
      throw new ConflictError('User owns one or more weather stations and cannot be deleted');
    }
    await this.userRepository.remove(id);
    logger.info({ userId: id }, 'User deleted');
  }

  async createUser(dto: CreateUserRequest): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('User with given email already exists');
    }
    const id = crypto.randomUUID();
    const user = User.create(id, dto.name, dto.surname, dto.email);
    await this.userRepository.save(user);
    logger.info({ userId: id, email: dto.email }, 'User created');
    return user;
  }

  async subscribe(id: string, stationId: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const station = await this.weatherStationRepository.findById(stationId);
    if (!station) {
      throw new NotFoundError('Weather station not found');
    }
    const updatedUser = user.subscribe(stationId);
    await this.userRepository.update(id, updatedUser);
    logger.info({ userId: id, stationId }, 'User subscribed to station');
  }
}

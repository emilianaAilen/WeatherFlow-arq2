import crypto from 'crypto';
import { User } from '@/domain';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { UserPort } from '@/user-interface/ports/UserPort';
import { CreateUserRequest } from '@/user-interface/dtos/CreateUserDTO';
import { UpdateUserRequest } from '@/user-interface/dtos/UpdateUserDTO';

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
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }
    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.userRepository.findByEmail(dto.email);
      if (emailTaken) {
        const error = new Error('User with given email already exists');
        (error as any).statusCode = 409;
        throw error;
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
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }
    const ownedStation = await this.weatherStationRepository.findStationByOwner(id);
    if (ownedStation) {
      const error = new Error('User owns one or more weather stations and cannot be deleted');
      (error as any).statusCode = 409;
      throw error;
    }
    await this.userRepository.remove(id);
  }

  async createUser(dto: CreateUserRequest): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      const error = new Error("User with given email already exists");
      (error as any).statusCode = 409;
      throw error;
    }
    const id = crypto.randomUUID();
    const user = User.create(id, dto.name, dto.surname, dto.email);
    await this.userRepository.save(user);
    return user;
  }

  async subscribe(id: string, stationId: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      const error = new Error('User not found');
      (error as any).statusCode = 404;
      throw error;
    }
    const station = await this.weatherStationRepository.findById(stationId);
    if (!station) {
      const error = new Error('Weather station not found');
      (error as any).statusCode = 404;
      throw error;
    }
    const updatedUser = user.subscribe(stationId);
    await this.userRepository.update(id, updatedUser);
  }
}

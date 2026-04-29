import crypto from 'crypto';
import { User } from '@/domain';
import { IUserRepository } from '@/infrastructure/ports/IUserRepository';
import { IWeatherStationRepository } from '@/infrastructure/ports/IWeatherStationRepository';
import { UserPort } from '@/user-interface/ports/UserPort';
import { CreateUserRequest } from '@/user-interface/dtos/CreateUserDTO';

export class UserService implements UserPort {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly weatherStationRepository: IWeatherStationRepository,
  ) {}

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
}

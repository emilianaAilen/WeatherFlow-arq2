import { User } from '@/domain';
import { CreateUserRequest } from '@/user-interface/dtos/CreateUserDTO';

export interface UserPort {
  createUser(dto: CreateUserRequest): Promise<User>;
}

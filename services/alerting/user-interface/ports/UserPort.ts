import { User } from '@/domain';
import { CreateUserRequest } from '@/user-interface/dtos/CreateUserDTO';
import { UpdateUserRequest } from '@/user-interface/dtos/UpdateUserDTO';

export interface UserPort {
  createUser(dto: CreateUserRequest): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, dto: UpdateUserRequest): Promise<User>;
  deleteUser(id: string): Promise<void>;
  subscribe(id: string, stationId: string): Promise<void>;
}

import { User } from '@/domain';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, user: User): Promise<void>;
  remove(id: string): Promise<void>;
  getAll(): Promise<User[]>;
}

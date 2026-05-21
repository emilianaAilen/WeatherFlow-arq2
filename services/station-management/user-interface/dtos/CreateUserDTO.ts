import { z } from 'zod';

export interface CreateUserRequest {
  name: string;
  surname: string;
  email: string;
}

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  surname: z.string().min(1, 'Surname is required'),
  email: z.email('Invalid email format'),
});

import { z } from 'zod';

export interface UpdateUserRequest {
  name?: string;
  surname?: string;
  email?: string;
}

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1, 'Name must not be empty').optional(),
    surname: z.string().min(1, 'Surname must not be empty').optional(),
    email: z.email('Invalid email format').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

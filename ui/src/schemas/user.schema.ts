import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  surname: z.string().min(1, 'Surname is required'),
  email: z.string().email('Must be a valid email address'),
});

export const updateUserSchema = createUserSchema
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined && v !== ''), {
    message: 'At least one field must be provided',
  });

export const subscribeSchema = z.object({
  weatherStationId: z.string().uuid('Must be a valid station UUID'),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type SubscribeFormData = z.infer<typeof subscribeSchema>;

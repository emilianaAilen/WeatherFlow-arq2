import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const CreateUserRequestSchema = z
  .object({
    name: z.string().min(1).openapi({ example: 'Jane', description: 'First name of the user' }),
    surname: z.string().min(1).openapi({ example: 'Doe', description: 'Last name of the user' }),
    email: z.email().openapi({ example: 'jane@example.com', description: 'Unique email address' }),
  })
  .openapi('CreateUserRequest');

export const UpdateUserRequestSchema = z
  .object({
    name: z.string().min(1).optional().openapi({ example: 'Jane', description: 'First name of the user' }),
    surname: z.string().min(1).optional().openapi({ example: 'Doe', description: 'Last name of the user' }),
    email: z.email().optional().openapi({ example: 'jane@example.com', description: 'Unique email address' }),
  })
  .openapi('UpdateUserRequest');

export const UserResponseSchema = z
  .object({
    id: z.uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Auto-generated UUID',
    }),
    name: z.string().openapi({ example: 'Jane' }),
    surname: z.string().openapi({ example: 'Doe' }),
    email: z.email().openapi({ example: 'jane@example.com' }),
  })
  .openapi('UserResponse');

export const SubscribeRequestSchema = z
  .object({
    weatherStationId: z.uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'UUID of the weather station to subscribe to',
    }),
  })
  .openapi('SubscribeRequest');

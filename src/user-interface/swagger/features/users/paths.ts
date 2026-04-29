import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { CreateUserRequestSchema, UserResponseSchema } from './schemas';
import { ErrorResponseSchema, ValidationErrorSchema } from '../../shared/responses';

export const userTag = { name: 'Users', description: 'User account management' };

export function registerUserPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'get',
    path: '/users',
    summary: 'List all users',
    description: 'Returns the full list of registered users.',
    tags: [userTag.name],
    responses: {
      200: {
        description: 'Users retrieved successfully.',
        content: { 'application/json': { schema: z.array(UserResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/users/{id}',
    summary: 'Get a user by ID',
    description: 'Returns a single user matching the provided UUID.',
    tags: [userTag.name],
    request: {
      params: z.object({ id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }) }),
    },
    responses: {
      200: {
        description: 'User found.',
        content: { 'application/json': { schema: UserResponseSchema } },
      },
      400: {
        description: 'The provided id is not a valid UUID.',
        content: { 'application/json': { schema: ErrorResponseSchema } },
      },
      404: {
        description: 'No user exists with the given id.',
        content: { 'application/json': { schema: ErrorResponseSchema } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/users',
    summary: 'Create a new user',
    description: 'Registers a new user account. The email must be unique across all users.',
    tags: [userTag.name],
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: CreateUserRequestSchema } },
      },
    },
    responses: {
      201: {
        description: 'User created successfully.',
        content: { 'application/json': { schema: UserResponseSchema } },
      },
      400: {
        description:
          'Request body failed validation — check that all fields are present and the email is valid.',
        content: { 'application/json': { schema: ValidationErrorSchema } },
      },
      409: {
        description: 'A user with the provided email already exists.',
        content: { 'application/json': { schema: ErrorResponseSchema } },
      },
    },
  });
}

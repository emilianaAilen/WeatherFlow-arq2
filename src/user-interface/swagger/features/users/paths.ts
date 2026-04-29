import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { CreateUserRequestSchema, UserResponseSchema } from './schemas';
import { ErrorResponseSchema, ValidationErrorSchema } from '../../shared/responses';

export const userTag = { name: 'Users', description: 'User account management' };

export function registerUserPaths(registry: OpenAPIRegistry): void {
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

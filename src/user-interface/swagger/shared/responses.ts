import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const ErrorResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'User with given email already exists' }),
  })
  .openapi('ErrorResponse');

export const ValidationErrorSchema = z
  .object({
    message: z.string().openapi({ example: 'Validation failed' }),
    errors: z
      .array(
        z.object({
          field: z.string().openapi({ example: 'email' }),
          message: z.string().openapi({ example: 'Invalid email format' }),
        }),
      )
      .optional()
      .openapi({ description: 'Per-field validation errors' }),
  })
  .openapi('ValidationError');

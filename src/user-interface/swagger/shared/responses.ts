import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export function errorResponse(messageExample: string) {
  return z.object({
    message: z.string().openapi({ example: messageExample }),
  });
}

export function validationErrorResponse(fieldExample: string, messageExample: string) {
  return z.object({
    message: z.string().openapi({ example: 'Validation failed' }),
    errors: z
      .array(
        z.object({
          field: z.string().openapi({ example: fieldExample }),
          message: z.string().openapi({ example: messageExample }),
        }),
      )
      .optional()
      .openapi({ description: 'Per-field validation errors' }),
  });
}

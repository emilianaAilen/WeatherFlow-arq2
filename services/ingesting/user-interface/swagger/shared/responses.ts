import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export function errorResponse(messageExample: string) {
  return z.object({
    message: z.string().openapi({ example: messageExample }),
  });
}

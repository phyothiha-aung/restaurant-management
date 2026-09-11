import { createZodDto } from 'nestjs-zod';
import { z } from '../../lib/zod.js'; // Adjust import to your zod instance

export const PaginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .default(10)
    .describe('Number of records to return per page'),
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Page number to retrieve'),
  search: z.string().optional().describe('Keyword to search'),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../common/pagination/dtos/pagination-query-dto.js';
import { z } from '../../common/lib/zod.js';

export const DiningTableStatusSchema = z.enum([
  'AVAILABLE',
  'OCCUPIED',
  'INACTIVE',
]);

export const DiningTableQuerySchema = PaginationQuerySchema.extend({
  status: DiningTableStatusSchema.optional(),
});

export class DiningTableQueryDto extends createZodDto(
  DiningTableQuerySchema,
) {}

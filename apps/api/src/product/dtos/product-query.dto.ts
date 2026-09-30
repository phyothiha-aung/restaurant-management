import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import { PaginationQuerySchema } from '../../common/pagination/dtos/pagination-query-dto.js';

const StrictBooleanSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const ProductQuerySchema = PaginationQuerySchema.extend({
  categoryId: z.coerce.number().int().positive().optional(),
  isActive: StrictBooleanSchema.optional(),
});

export class ProductQueryDto extends createZodDto(ProductQuerySchema) {}

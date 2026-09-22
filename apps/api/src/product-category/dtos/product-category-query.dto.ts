import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../common/pagination/dtos/pagination-query-dto.js';
import { z } from '../../common/lib/zod.js';

const StrictBooleanSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const ProductCategoryQuerySchema = PaginationQuerySchema.extend({
  isActive: StrictBooleanSchema.optional(),
});

export class ProductCategoryQueryDto extends createZodDto(
  ProductCategoryQuerySchema,
) {}

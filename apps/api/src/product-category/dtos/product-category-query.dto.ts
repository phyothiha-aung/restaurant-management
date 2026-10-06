import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

const StrictBooleanSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const ProductCategoryQuerySchema = z.object({
  search: z.string().optional(),
  isActive: StrictBooleanSchema.optional(),
});

export class ProductCategoryQueryDto extends createZodDto(
  ProductCategoryQuerySchema,
) {}

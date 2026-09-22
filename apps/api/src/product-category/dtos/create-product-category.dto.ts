import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const ProductCategoryFieldsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const CreateProductCategorySchema = ProductCategoryFieldsSchema.extend({
  sortOrder: ProductCategoryFieldsSchema.shape.sortOrder.default(0),
  isActive: ProductCategoryFieldsSchema.shape.isActive.default(true),
});

export class CreateProductCategoryDto extends createZodDto(
  CreateProductCategorySchema,
) {}

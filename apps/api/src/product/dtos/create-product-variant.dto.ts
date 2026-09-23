import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const ProductVariantFieldsSchema = z.object({
  name: z.string().trim().min(1).max(50),
  price: z.number().nonnegative(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const CreateProductVariantSchema = ProductVariantFieldsSchema.extend({
  sortOrder: ProductVariantFieldsSchema.shape.sortOrder.default(0),
  isActive: ProductVariantFieldsSchema.shape.isActive.default(true),
});

export class CreateProductVariantDto extends createZodDto(
  CreateProductVariantSchema,
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const ProductAddonFieldsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unitPrice: z.number().nonnegative(),
  maxQuantity: z.number().int().positive(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const CreateProductAddonSchema = ProductAddonFieldsSchema.extend({
  maxQuantity: ProductAddonFieldsSchema.shape.maxQuantity.default(1),
  sortOrder: ProductAddonFieldsSchema.shape.sortOrder.default(0),
  isActive: ProductAddonFieldsSchema.shape.isActive.default(true),
});

export class CreateProductAddonDto extends createZodDto(
  CreateProductAddonSchema,
) {}

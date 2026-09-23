import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const ProductFieldsSchema = z.object({
  categoryId: z.number().int().positive(),
  code: z.string().trim().max(30).optional().nullable(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const CreateProductSchema = ProductFieldsSchema.extend({
  sortOrder: ProductFieldsSchema.shape.sortOrder.default(0),
  isActive: ProductFieldsSchema.shape.isActive.default(true),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}

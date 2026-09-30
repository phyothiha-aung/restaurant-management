import { createZodDto } from 'nestjs-zod';
import { ProductCategoryFieldsSchema } from './create-product-category.dto.js';

export const UpdateProductCategorySchema = ProductCategoryFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export class UpdateProductCategoryDto extends createZodDto(
  UpdateProductCategorySchema,
) {}

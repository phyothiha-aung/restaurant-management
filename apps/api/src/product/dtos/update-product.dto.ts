import { createZodDto } from 'nestjs-zod';
import { ProductFieldsSchema } from './create-product.dto.js';

export const UpdateProductSchema = ProductFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}

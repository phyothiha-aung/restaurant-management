import { createZodDto } from 'nestjs-zod';
import { ProductVariantFieldsSchema } from './create-product-variant.dto.js';

export const UpdateProductVariantSchema =
  ProductVariantFieldsSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: 'At least one field is required' },
  );

export class UpdateProductVariantDto extends createZodDto(
  UpdateProductVariantSchema,
) {}

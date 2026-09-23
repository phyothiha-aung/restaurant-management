import { createZodDto } from 'nestjs-zod';
import { ProductAddonFieldsSchema } from './create-product-addon.dto.js';

export const UpdateProductAddonSchema =
  ProductAddonFieldsSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: 'At least one field is required' },
  );

export class UpdateProductAddonDto extends createZodDto(
  UpdateProductAddonSchema,
) {}

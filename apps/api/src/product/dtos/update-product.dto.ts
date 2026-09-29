import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import {
  ProductAddonAssignmentSchema,
  ProductFieldsSchema,
  ProductVariantInputSchema,
} from './create-product.dto.js';

export const UpdateProductSchema = ProductFieldsSchema.partial()
  .extend({
    variants: z.array(ProductVariantInputSchema).optional(),
    addons: z.array(ProductAddonAssignmentSchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}

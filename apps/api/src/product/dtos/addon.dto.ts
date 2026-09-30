import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import { CatalogMoneySchema } from './create-product.dto.js';

export const AddonFieldsSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unitPrice: CatalogMoneySchema,
  isActive: z.boolean(),
});

export const CreateAddonSchema = AddonFieldsSchema.extend({
  isActive: AddonFieldsSchema.shape.isActive.default(true),
});

export const UpdateAddonSchema = AddonFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export class CreateAddonDto extends createZodDto(CreateAddonSchema) {}
export class UpdateAddonDto extends createZodDto(UpdateAddonSchema) {}

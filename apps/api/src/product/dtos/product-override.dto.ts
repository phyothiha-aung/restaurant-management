import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const ProductOverrideSchema = z.object({
  isAvailable: z.boolean(),
});

export class ProductOverrideDto extends createZodDto(ProductOverrideSchema) {}

export const OptionOverrideSchema = z
  .object({
    priceOverride: z.number().nonnegative().optional().nullable(),
    isAvailable: z.boolean().optional().nullable(),
  })
  .refine(
    (value) =>
      (value.priceOverride !== undefined && value.priceOverride !== null) ||
      (value.isAvailable !== undefined && value.isAvailable !== null),
    { message: 'At least one override field is required' },
  );

export class OptionOverrideDto extends createZodDto(OptionOverrideSchema) {}

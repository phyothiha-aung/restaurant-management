import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import { isSupportedTimeZone } from '../../environment.validation.js';

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' ? value.trim() || null : value,
    z.string().max(max).nullable().optional(),
  );

export const UpdateRestaurantSettingsSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    address: optionalText(300),
    phone: optionalText(30),
    taxId: optionalText(50),
    timeZone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(isSupportedTimeZone, 'Must be a supported IANA timezone')
      .optional(),
    receiptFooter: optionalText(300),
    receiptPaperWidth: z.union([z.literal(58), z.literal(80)]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export class UpdateRestaurantSettingsDto extends createZodDto(
  UpdateRestaurantSettingsSchema,
) {}

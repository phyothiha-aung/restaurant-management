import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
} from '../../storage/storage.constants.js';

export const PresignRestaurantLogoSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(
    Object.keys(ALLOWED_IMAGE_TYPES) as [
      keyof typeof ALLOWED_IMAGE_TYPES,
      ...(keyof typeof ALLOWED_IMAGE_TYPES)[],
    ],
  ),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_SIZE),
});

export class PresignRestaurantLogoDto extends createZodDto(
  PresignRestaurantLogoSchema,
) {}

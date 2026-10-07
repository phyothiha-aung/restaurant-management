import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const AttachRestaurantLogoSchema = z.object({
  fileId: z.uuid(),
});

export class AttachRestaurantLogoDto extends createZodDto(
  AttachRestaurantLogoSchema,
) {}

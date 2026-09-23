import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const AttachProductImageSchema = z.object({
  fileId: z.string().uuid(),
});

export class AttachProductImageDto extends createZodDto(
  AttachProductImageSchema,
) {}

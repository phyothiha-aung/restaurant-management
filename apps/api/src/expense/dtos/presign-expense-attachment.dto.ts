import { createZodDto } from 'nestjs-zod';
import { StoredFilePurpose } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';
import {
  ALLOWED_FILE_TYPES,
  MAX_UPLOAD_SIZE,
} from '../../storage/storage.constants.js';

export const PresignExpenseAttachmentSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(Object.keys(ALLOWED_FILE_TYPES) as [
    keyof typeof ALLOWED_FILE_TYPES,
    ...(keyof typeof ALLOWED_FILE_TYPES)[],
  ]),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_SIZE),
  purpose: z.enum(StoredFilePurpose),
});

export class PresignExpenseAttachmentDto extends createZodDto(
  PresignExpenseAttachmentSchema,
) {}

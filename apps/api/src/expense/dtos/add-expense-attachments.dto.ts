import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import { MAX_EXPENSE_ATTACHMENTS } from '../../storage/storage.constants.js';

export const AttachmentIdsSchema = z
  .array(z.uuid())
  .min(1)
  .max(MAX_EXPENSE_ATTACHMENTS)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'Attachment IDs must be unique',
  });

export const AddExpenseAttachmentsSchema = z.object({
  attachmentIds: AttachmentIdsSchema,
});

export class AddExpenseAttachmentsDto extends createZodDto(
  AddExpenseAttachmentsSchema,
) {}

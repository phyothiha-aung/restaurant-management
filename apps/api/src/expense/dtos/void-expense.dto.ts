import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const VoidExpenseSchema = z.object({
  reason: z.string().trim().min(3).max(300),
});

export class VoidExpenseDto extends createZodDto(VoidExpenseSchema) {}

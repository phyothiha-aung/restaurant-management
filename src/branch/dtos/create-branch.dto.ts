import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const CreateBranchSchema = z.object({
  branchCode: z.string().trim().min(1).max(30).optional().nullable(),
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().max(300).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  isActive: z.boolean().default(true),
});

export class CreateBranchDto extends createZodDto(CreateBranchSchema) {}

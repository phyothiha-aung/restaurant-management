import { createZodDto } from 'nestjs-zod';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';

export const UpdateUserSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.email('Invalid email address').optional(),
    password: z.string().min(8).max(72).optional(),
    role: z.enum(UserRole).optional(),
    status: z.enum(UserStatus).optional(),
    branchId: z.number().int().positive().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

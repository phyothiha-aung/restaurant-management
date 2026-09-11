import { createZodDto } from 'nestjs-zod';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';

export const CreateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.email('Invalid email address'),
  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters long')
    .max(72, 'Password cannot exceed 72 characters'),
  role: z.enum(UserRole).default(UserRole.WAITER),
  status: z.enum(UserStatus).default(UserStatus.PENDING),
  branchId: z.number().int().positive().optional().nullable(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

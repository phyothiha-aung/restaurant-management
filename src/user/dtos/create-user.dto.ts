import { createZodDto } from 'nestjs-zod';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';

export const CreateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.email('Invalid email address').optional().nullable(),
  password: z.string('Password is required').optional().nullable(),
  role: z.enum(UserRole).default(UserRole.WAITER),
  status: z.enum(UserStatus).default(UserStatus.PENDING),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores',
    )
    .optional()
    .nullable(),
  pin: z
    .string()
    .regex(/^\d{4}$/, 'PIN must be 4 digits')
    .optional()
    .nullable(),

  branchId: z.number().int().positive().optional().nullable(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

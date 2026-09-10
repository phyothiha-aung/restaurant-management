import { createZodDto } from 'nestjs-zod';
import { UserRole } from '../../generated/prisma/enums.js';
import { TokenType } from '../constants/auth.constant.js';
import { z } from '../../common/lib/zod.js';

const ActiveUserSchema = z.object({
  sub: z.int().positive(),
  email: z.email('Invalid email address').nullable(),
  role: z.enum(UserRole),
  restaurantId: z.int().positive().nullable(),
  tokenType: z.enum(TokenType),
  jti: z.string().optional(),
});

export class ActiveUserDto extends createZodDto(ActiveUserSchema) {}

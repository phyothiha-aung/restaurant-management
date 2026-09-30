import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../common/pagination/dtos/pagination-query-dto.js';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';

export const UserQuerySchema = PaginationQuerySchema.extend({
  role: z.enum(UserRole).optional(),
  status: z.enum(UserStatus).optional(),
  branchId: z.coerce.number().int().positive().optional(),
});

export class UserQueryDto extends createZodDto(UserQuerySchema) {}

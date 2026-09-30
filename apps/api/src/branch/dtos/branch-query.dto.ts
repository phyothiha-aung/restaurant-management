import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../common/pagination/dtos/pagination-query-dto.js';
import { z } from '../../common/lib/zod.js';

const StrictBooleanSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const BranchQuerySchema = PaginationQuerySchema.extend({
  isActive: StrictBooleanSchema.optional(),
});

export class BranchQueryDto extends createZodDto(BranchQuerySchema) {}

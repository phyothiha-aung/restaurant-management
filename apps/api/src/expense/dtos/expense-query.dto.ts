import { createZodDto } from 'nestjs-zod';
import { ExpenseCategory, ExpenseStatus } from '../../generated/prisma/enums.js';
import { PaginationQuerySchema } from '../../common/pagination/dtos/pagination-query-dto.js';
import { z } from '../../common/lib/zod.js';
import { ExpenseDateSchema } from './expense-validation.js';

export const ExpenseQuerySchema = PaginationQuerySchema.extend({
  category: z.enum(ExpenseCategory).optional(),
  status: z.enum(ExpenseStatus).default(ExpenseStatus.ACTIVE),
  branchId: z.coerce.number().int().positive().optional(),
  dateFrom: ExpenseDateSchema.optional(),
  dateTo: ExpenseDateSchema.optional(),
}).refine(
  (value) =>
    !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
  {
    message: 'dateFrom must be on or before dateTo',
    path: ['dateTo'],
  },
);

export class ExpenseQueryDto extends createZodDto(ExpenseQuerySchema) {}

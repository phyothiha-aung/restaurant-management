import { createZodDto } from 'nestjs-zod';
import { ExpenseCategory } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';
import {
  ExpenseAmountSchema,
  ExpenseDateSchema,
} from './expense-validation.js';

export const CreateExpenseSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  category: z.enum(ExpenseCategory),
  amount: ExpenseAmountSchema,
  expenseDate: ExpenseDateSchema,
  branchId: z.number().int().positive().optional().nullable(),
});

export class CreateExpenseDto extends createZodDto(CreateExpenseSchema) {}

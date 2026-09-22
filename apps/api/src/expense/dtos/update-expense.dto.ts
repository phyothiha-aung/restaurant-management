import { createZodDto } from 'nestjs-zod';
import { CreateExpenseSchema } from './create-expense.dto.js';

export const UpdateExpenseSchema = CreateExpenseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export class UpdateExpenseDto extends createZodDto(UpdateExpenseSchema) {}

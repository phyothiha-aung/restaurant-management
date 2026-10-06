import { createZodDto } from 'nestjs-zod';
import { DiningTableFieldsSchema } from './create-dining-table.dto.js';

export const UpdateDiningTableSchema = DiningTableFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export class UpdateDiningTableDto extends createZodDto(
  UpdateDiningTableSchema,
) {}

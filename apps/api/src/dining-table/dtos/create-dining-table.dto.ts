import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const DiningTableFieldsSchema = z.object({
  name: z.string().trim().min(1).max(50),
  capacity: z.number().int().min(1).max(100).optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const CreateDiningTableSchema = DiningTableFieldsSchema.extend({
  sortOrder: DiningTableFieldsSchema.shape.sortOrder.default(0),
  isActive: DiningTableFieldsSchema.shape.isActive.default(true),
});

export class CreateDiningTableDto extends createZodDto(
  CreateDiningTableSchema,
) {}

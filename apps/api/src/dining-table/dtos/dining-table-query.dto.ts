import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const DiningTableStatusSchema = z.enum([
  'AVAILABLE',
  'OCCUPIED',
  'INACTIVE',
]);

export const DiningTableQuerySchema = z.object({
  search: z.string().optional(),
  status: DiningTableStatusSchema.optional(),
});

export class DiningTableQueryDto extends createZodDto(
  DiningTableQuerySchema,
) {}

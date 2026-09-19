import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const UpdateSelfSchema = z
  .object({
    name: z.string().min(2).optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export class UpdateSelfDto extends createZodDto(UpdateSelfSchema) {}

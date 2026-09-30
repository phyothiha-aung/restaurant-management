import { createZodDto } from 'nestjs-zod';
import { CreateBranchSchema } from './create-branch.dto.js';

export const UpdateBranchSchema = CreateBranchSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' },
);

export class UpdateBranchDto extends createZodDto(UpdateBranchSchema) {}

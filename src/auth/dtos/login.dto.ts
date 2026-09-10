import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

// 1. Define your schema
const LoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// 2. Create the DTO class from the schema
export class LoginDto extends createZodDto(LoginSchema) {}

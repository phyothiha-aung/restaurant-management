import { z } from './common/lib/zod.js';

export default z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging', 'uat'])
    .default('production'),

  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1),

  FRONTEND_URL: z.url().default('http://localhost:3000'),

  JWT_SECRET: z.string().min(1),
  JWT_TOKEN_AUDIENCE: z.string().min(1),
  JWT_TOKEN_ISSUER: z.string().min(1),
  JWT_ACCESS_TOKEN_TTL: z.coerce.number().int().positive().default(600),
  JWT_REFRESH_TOKEN_TTL: z.coerce.number().int().positive().default(604800),
  JWT_REFRESH_TOKEN_TTL_ADMIN: z.coerce
    .number()
    .int()
    .positive()
    .default(86400),
});

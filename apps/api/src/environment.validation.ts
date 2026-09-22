import { z } from './common/lib/zod.js';

const optionalCredential = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

export default z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'staging', 'uat'])
    .default('development'),

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

  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_ACCESS_KEY_ID: optionalCredential,
  AWS_SECRET_ACCESS_KEY: optionalCredential,
}).superRefine((value, context) => {
  if (Boolean(value.AWS_ACCESS_KEY_ID) !== Boolean(value.AWS_SECRET_ACCESS_KEY)) {
    context.addIssue({
      code: 'custom',
      path: ['AWS_ACCESS_KEY_ID'],
      message: 'AWS access key ID and secret access key must be provided together',
    });
  }
});

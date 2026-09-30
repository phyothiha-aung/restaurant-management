import { describe, expect, it } from 'vitest';
import environmentValidation from './environment.validation.js';

const baseEnvironment = {
  DATABASE_URL: 'postgresql://localhost/restaurant',
  JWT_SECRET: 'secret',
  JWT_TOKEN_AUDIENCE: 'restaurant-web',
  JWT_TOKEN_ISSUER: 'restaurant-api',
  AWS_REGION: 'ap-southeast-1',
  AWS_S3_BUCKET: 'restaurant-files',
};

describe('environment validation', () => {
  it('allows the AWS default credential chain', () => {
    const result = environmentValidation.safeParse({
      ...baseEnvironment,
      AWS_ACCESS_KEY_ID: '',
      AWS_SECRET_ACCESS_KEY: '',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.NODE_ENV).toBe('development');
  });

  it('accepts a complete static credential pair', () => {
    expect(
      environmentValidation.safeParse({
        ...baseEnvironment,
        AWS_ACCESS_KEY_ID: 'access-key',
        AWS_SECRET_ACCESS_KEY: 'secret-key',
      }).success,
    ).toBe(true);
  });

  it('rejects an incomplete static credential pair', () => {
    expect(
      environmentValidation.safeParse({
        ...baseEnvironment,
        AWS_ACCESS_KEY_ID: 'access-key',
      }).success,
    ).toBe(false);
  });
});

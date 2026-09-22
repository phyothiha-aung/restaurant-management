import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { StoredFilePurpose } from '../generated/prisma/enums.js';
import {
  buildObjectKey,
  getEnvironmentPrefix,
  hasExpectedSignature,
  sanitizeFileName,
} from './storage.constants.js';

describe('storage constants', () => {
  it.each([
    ['production', 'production'],
    ['test', 'test'],
    ['staging', 'staging'],
    ['uat', 'uat'],
    ['development', 'development'],
    [undefined, 'development'],
  ])('maps environment %s to %s', (environment, expected) => {
    expect(getEnvironmentPrefix(environment)).toBe(expected);
  });

  it('builds an identifiable expense path without trusting path separators', () => {
    expect(
      buildObjectKey({
        environment: 'production',
        purpose: StoredFilePurpose.EXPENSE,
        fileId: 'file-id',
        fileName: '../../My receipt.PDF',
        mimeType: 'application/pdf',
      }),
    ).toBe('production/expenses/file-id/My-receipt.pdf');
  });

  it('uses the controlled future recipe and product prefixes', () => {
    expect(
      buildObjectKey({
        environment: 'development',
        purpose: StoredFilePurpose.RECIPE,
        fileId: 'one',
        fileName: 'dish.jpg',
        mimeType: 'image/jpeg',
      }),
    ).toContain('development/recipes/one/');
    expect(
      buildObjectKey({
        environment: 'development',
        purpose: StoredFilePurpose.PRODUCT,
        fileId: 'two',
        fileName: 'item.png',
        mimeType: 'image/png',
      }),
    ).toContain('development/products/two/');
  });

  it('rejects unsupported MIME types', () => {
    expect(() =>
      buildObjectKey({
        purpose: StoredFilePurpose.EXPENSE,
        fileId: 'file-id',
        fileName: 'script.svg',
        mimeType: 'image/svg+xml',
      }),
    ).toThrow(BadRequestException);
  });

  it('normalizes filenames and verifies supported signatures', () => {
    expect(sanitizeFileName(' spicy  noodles!!.jpeg', 'image/jpeg')).toBe(
      'spicy-noodles.jpg',
    );
    expect(hasExpectedSignature('application/pdf', new TextEncoder().encode('%PDF-1.7'))).toBe(true);
    expect(hasExpectedSignature('image/jpeg', new Uint8Array([0xff, 0xd8, 0xff]))).toBe(true);
    expect(hasExpectedSignature('image/png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(hasExpectedSignature('image/webp', new TextEncoder().encode('RIFF0000WEBP'))).toBe(true);
  });
});

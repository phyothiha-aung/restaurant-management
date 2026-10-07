import { describe, expect, it } from 'vitest';
import { PresignRestaurantLogoSchema } from './presign-restaurant-logo.dto.js';

describe('PresignRestaurantLogoSchema', () => {
  it('accepts supported images within the size limit', () => {
    expect(
      PresignRestaurantLogoSchema.safeParse({
        fileName: 'logo.webp',
        mimeType: 'image/webp',
        sizeBytes: 1024,
      }).success,
    ).toBe(true);
  });

  it('rejects PDFs and oversized images', () => {
    expect(
      PresignRestaurantLogoSchema.safeParse({
        fileName: 'logo.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      }).success,
    ).toBe(false);
    expect(
      PresignRestaurantLogoSchema.safeParse({
        fileName: 'logo.png',
        mimeType: 'image/png',
        sizeBytes: 10 * 1024 * 1024 + 1,
      }).success,
    ).toBe(false);
  });
});

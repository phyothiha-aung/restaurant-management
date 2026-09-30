import { describe, expect, it } from 'vitest';
import { CreateAddonSchema, UpdateAddonSchema } from './addon.dto.js';
import { AddonQuerySchema } from './addon-query.dto.js';
import { CreateProductSchema } from './create-product.dto.js';
import { UpdateProductSchema } from './update-product.dto.js';

const product = {
  categoryId: 1,
  name: 'Tea',
  variants: [{ name: 'Regular', price: '1500' }],
};

describe('product DTO schemas', () => {
  it('applies aggregate defaults and keeps decimal prices as strings', () => {
    const result = CreateProductSchema.parse(product);

    expect(result.isActive).toBe(true);
    expect(result.variants[0]?.price).toBe('1500');
    expect(result.variants[0]?.isActive).toBe(true);
    expect(result.addons).toEqual([]);
  });

  it.each(['-1', '1.001', '1000000000000', '01.00', 1500])(
    'rejects invalid catalog money %s',
    (price) => {
      expect(
        CreateProductSchema.safeParse({
          ...product,
          variants: [{ name: 'Regular', price }],
        }).success,
      ).toBe(false);
    },
  );

  it('requires an active variant for an active product', () => {
    expect(
      CreateProductSchema.safeParse({
        ...product,
        variants: [{ name: 'Regular', price: '1500', isActive: false }],
      }).success,
    ).toBe(false);
  });

  it('supports partial aggregate updates but rejects an empty update', () => {
    expect(UpdateProductSchema.safeParse({}).success).toBe(false);
    expect(
      UpdateProductSchema.safeParse({
        addons: [{ addonId: 2, maxQuantity: 3 }],
      }).success,
    ).toBe(true);
  });
});

describe('add-on DTO schemas', () => {
  it('validates prices, update payloads, and strict boolean filters', () => {
    expect(
      CreateAddonSchema.parse({ name: 'Extra cheese', unitPrice: '500' }),
    ).toEqual({ name: 'Extra cheese', unitPrice: '500', isActive: true });
    expect(UpdateAddonSchema.safeParse({}).success).toBe(false);
    expect(AddonQuerySchema.parse({ isActive: 'false' }).isActive).toBe(false);
    expect(AddonQuerySchema.safeParse({ isActive: '1' }).success).toBe(false);
  });
});

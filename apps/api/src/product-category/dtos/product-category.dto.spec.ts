import { describe, expect, it } from 'vitest';
import { CreateProductCategorySchema } from './create-product-category.dto.js';
import { ProductCategoryQuerySchema } from './product-category-query.dto.js';
import { UpdateProductCategorySchema } from './update-product-category.dto.js';

describe('product category DTO schemas', () => {
  it('accepts and trims a valid category', () => {
    const result = CreateProductCategorySchema.parse({
      name: '  Noodles  ',
      description: '  Noodle dishes  ',
      sortOrder: 2,
    });
    expect(result).toMatchObject({
      name: 'Noodles',
      description: 'Noodle dishes',
      sortOrder: 2,
      isActive: true,
    });
  });

  it('rejects invalid names and negative sort order', () => {
    expect(CreateProductCategorySchema.safeParse({ name: 'A' }).success).toBe(false);
    expect(
      CreateProductCategorySchema.safeParse({ name: 'Drinks', sortOrder: -1 }).success,
    ).toBe(false);
  });

  it('requires at least one update field', () => {
    expect(UpdateProductCategorySchema.safeParse({}).success).toBe(false);
    expect(UpdateProductCategorySchema.safeParse({ isActive: true }).success).toBe(true);
  });

  it('parses only strict boolean list filters', () => {
    expect(ProductCategoryQuerySchema.parse({ isActive: 'false' }).isActive).toBe(false);
    expect(ProductCategoryQuerySchema.safeParse({ isActive: '1' }).success).toBe(false);
  });
});

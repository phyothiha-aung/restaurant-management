import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';

export const CatalogMoneySchema = z
  .string()
  .trim()
  .regex(
    /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/,
    'Must be a non-negative decimal with at most 12 whole digits and 2 decimal places',
  );

export const ProductVariantInputSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(50),
  price: CatalogMoneySchema,
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const ProductAddonAssignmentSchema = z.object({
  addonId: z.number().int().positive(),
  maxQuantity: z.number().int().positive().default(1),
  sortOrder: z.number().int().min(0).default(0),
});

export const ProductFieldsSchema = z.object({
  categoryId: z.number().int().positive(),
  code: z.string().trim().max(30).optional().nullable(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export const CreateProductSchema = ProductFieldsSchema.extend({
  sortOrder: ProductFieldsSchema.shape.sortOrder.default(0),
  isActive: ProductFieldsSchema.shape.isActive.default(true),
  variants: z
    .array(ProductVariantInputSchema.omit({ id: true }))
    .min(1, 'At least one variant is required'),
  addons: z.array(ProductAddonAssignmentSchema).default([]),
}).superRefine((value, context) => {
  if (value.isActive && !value.variants.some((variant) => variant.isActive)) {
    context.addIssue({
      code: 'custom',
      path: ['variants'],
      message: 'An active product requires at least one active variant',
    });
  }
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}

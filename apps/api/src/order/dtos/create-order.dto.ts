import { createZodDto } from 'nestjs-zod';
import { DiscountType, OrderType } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';
import { OrderMoneySchema, OrderPercentSchema } from './order-validation.js';

export const OrderItemAddonInputSchema = z.object({
  addonId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

const validateUniqueAddons = (
  value: { addons: Array<{ addonId: number }> },
  context: z.RefinementCtx,
) => {
  const addonIds = value.addons.map((addon) => addon.addonId);
  if (new Set(addonIds).size !== addonIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['addons'],
      message: 'Add-on IDs must be unique within an item',
    });
  }
};

export const OrderItemFieldsSchema = z.object({
  id: z.number().int().positive().optional(),
  productVariantId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  addons: z.array(OrderItemAddonInputSchema).default([]),
});

export const OrderItemInputSchema =
  OrderItemFieldsSchema.superRefine(validateUniqueAddons);

export const OrderDiscountSchema = z
  .object({
    type: z.enum(DiscountType),
    value: OrderMoneySchema,
  })
  .superRefine((value, context) => {
    if (value.type === DiscountType.PERCENT && Number(value.value) > 100) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Percentage discount must be between 0 and 100',
      });
    }
  });

export const CreateOrderSchema = z
  .object({
    orderType: z.enum(OrderType),
    tableId: z.number().int().positive().optional().nullable(),
    items: z
      .array(
        OrderItemFieldsSchema.omit({ id: true }).superRefine(
          validateUniqueAddons,
        ),
      )
      .min(1),
    discount: OrderDiscountSchema.optional().nullable(),
    taxPercent: OrderPercentSchema.default('0'),
  })
  .superRefine((value, context) => {
    if (value.orderType === OrderType.DINE_IN && !value.tableId) {
      context.addIssue({
        code: 'custom',
        path: ['tableId'],
        message: 'A table is required for dine-in orders',
      });
    }
    if (value.orderType === OrderType.TAKEAWAY && value.tableId != null) {
      context.addIssue({
        code: 'custom',
        path: ['tableId'],
        message: 'Takeaway orders cannot have a table',
      });
    }
  });

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}

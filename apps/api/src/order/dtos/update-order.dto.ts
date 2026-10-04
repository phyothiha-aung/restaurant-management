import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import {
  OrderDiscountSchema,
  OrderItemInputSchema,
} from './create-order.dto.js';
import { OrderPercentSchema } from './order-validation.js';

export const UpdateOrderSchema = z
  .object({
    items: z.array(OrderItemInputSchema).min(1).optional(),
    discount: OrderDiscountSchema.optional().nullable(),
    taxPercent: OrderPercentSchema.optional(),
  })
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'At least one field is required',
      });
    }
    const ids =
      value.items?.flatMap((item) => (item.id ? [item.id] : [])) ?? [];
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'Order item IDs must be unique',
      });
    }
  });

export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {}

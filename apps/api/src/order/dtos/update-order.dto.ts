import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import {
  OrderDiscountSchema,
  OrderItemInputSchema,
} from './create-order.dto.js';
import { OrderPercentSchema } from './order-validation.js';
import { OrderType } from '../../generated/prisma/enums.js';

export const UpdateOrderSchema = z
  .object({
    items: z.array(OrderItemInputSchema).min(1).optional(),
    orderType: z.enum(OrderType).optional(),
    tableId: z.number().int().positive().optional().nullable(),
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
    if (value.orderType === OrderType.TAKEAWAY && value.tableId != null) {
      context.addIssue({
        code: 'custom',
        path: ['tableId'],
        message: 'Takeaway orders cannot have a table',
      });
    }
    if (value.orderType === OrderType.DINE_IN && value.tableId === null) {
      context.addIssue({
        code: 'custom',
        path: ['tableId'],
        message: 'A dine-in order cannot clear its table',
      });
    }
  });

export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {}

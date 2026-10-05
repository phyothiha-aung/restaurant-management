import { describe, expect, it } from 'vitest';
import { DiscountType, OrderStatus } from '../../generated/prisma/enums.js';
import { CreateOrderSchema } from './create-order.dto.js';
import { OrderQuerySchema } from './order-query.dto.js';
import { UpdateOrderSchema } from './update-order.dto.js';

const item = {
  productVariantId: 10,
  quantity: 2,
  addons: [{ addonId: 20, quantity: 1 }],
};

describe('order DTOs', () => {
  it('defaults tax to zero and add-on collections to an array', () => {
    const result = CreateOrderSchema.parse({
      items: [{ productVariantId: 10, quantity: 1 }],
    });
    expect(result.taxPercent).toBe('0');
    expect(result.items[0]?.addons).toEqual([]);
  });

  it('accepts fixed and percentage discounts', () => {
    expect(
      CreateOrderSchema.safeParse({
        items: [item],
        discount: { type: DiscountType.FIXED_AMOUNT, value: '500' },
      }).success,
    ).toBe(true);
    expect(
      CreateOrderSchema.safeParse({
        items: [item],
        discount: { type: DiscountType.PERCENT, value: '12.5' },
      }).success,
    ).toBe(true);
  });

  it.each(['100.01', '1000', '-1'])(
    'rejects invalid percentage %s',
    (value) => {
      expect(
        CreateOrderSchema.safeParse({
          items: [item],
          discount: { type: DiscountType.PERCENT, value },
        }).success,
      ).toBe(false);
    },
  );

  it('rejects duplicate add-ons and invalid quantities', () => {
    expect(
      CreateOrderSchema.safeParse({
        items: [
          {
            ...item,
            addons: [
              { addonId: 20, quantity: 1 },
              { addonId: 20, quantity: 1 },
            ],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      CreateOrderSchema.safeParse({ items: [{ ...item, quantity: 0 }] })
        .success,
    ).toBe(false);
  });

  it('rejects duplicate update item IDs and empty updates', () => {
    expect(UpdateOrderSchema.safeParse({}).success).toBe(false);
    expect(
      UpdateOrderSchema.safeParse({
        items: [
          { id: 1, ...item },
          { id: 1, ...item },
        ],
      }).success,
    ).toBe(false);
  });

  it('validates query enums, bounds, and inclusive date ranges', () => {
    expect(
      OrderQuerySchema.safeParse({
        status: OrderStatus.OPEN,
        page: '1',
        limit: '100',
        dateFrom: '2026-09-01',
        dateTo: '2026-09-30',
      }).success,
    ).toBe(true);
    expect(OrderQuerySchema.safeParse({ status: 'UNKNOWN' }).success).toBe(
      false,
    );
    expect(
      OrderQuerySchema.safeParse({
        dateFrom: '2026-10-01',
        dateTo: '2026-09-30',
      }).success,
    ).toBe(false);
    expect(OrderQuerySchema.safeParse({ dateFrom: '2026-02-30' }).success).toBe(
      false,
    );
  });
});

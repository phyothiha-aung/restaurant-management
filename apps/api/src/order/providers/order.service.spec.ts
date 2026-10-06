import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  DiscountType,
  OrderType,
  UserRole,
} from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { OrderService } from './order.service.js';

const createService = (role: UserRole = UserRole.MANAGER) => {
  const actor = { id: 1, role };
  const prisma: any = {
    order: { findFirst: vi.fn() },
  };
  const pagination: any = { paginateRawQuery: vi.fn() };
  const users: any = { requireUser: vi.fn().mockResolvedValue(actor) };
  return {
    service: new OrderService(prisma, pagination, users),
    prisma,
    actor,
  };
};

describe('OrderService calculations and permissions', () => {
  it('applies percentage discount before tax with half-up rounding', () => {
    const { service } = createService();
    const result = (service as any).calculateOrder(
      [new Prisma.Decimal('1000')],
      { type: DiscountType.PERCENT, value: '10' },
      '5',
    );
    expect(result.subtotal.toFixed(2)).toBe('1000.00');
    expect(result.discountAmount.toFixed(2)).toBe('100.00');
    expect(result.taxAmount.toFixed(2)).toBe('45.00');
    expect(result.totalAmount.toFixed(2)).toBe('945.00');
  });

  it('rejects a fixed discount larger than the subtotal', () => {
    const { service } = createService();
    expect(() =>
      (service as any).calculateOrder(
        [new Prisma.Decimal('100')],
        { type: DiscountType.FIXED_AMOUNT, value: '101' },
        '0',
      ),
    ).toThrow(BadRequestException);
  });

  it('denies chefs from mutating orders', async () => {
    const { service } = createService(UserRole.CHEF);
    await expect(service.cancel(1, { sub: 1 } as any)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('keeps existing variant and add-on snapshot prices after catalog changes', async () => {
    const { service } = createService();
    const tx: any = {
      productAddon: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const current: any = {
      id: 4,
      productVariantId: 10,
      productName: 'Tea',
      variantName: 'Regular',
      unitPrice: new Prisma.Decimal('1000'),
      productVariant: { productId: 5 },
      addons: [
        {
          addonId: 20,
          addonName: 'Milk',
          unitPrice: new Prisma.Decimal('100'),
          quantity: 1,
        },
      ],
    };

    const result = await (service as any).buildExistingItem(tx, current, {
      id: 4,
      productVariantId: 10,
      quantity: 2,
      addons: [{ addonId: 20, quantity: 1 }],
    });

    expect(result.baseSubtotal.toFixed(2)).toBe('2000.00');
    expect(result.addonTotal.toFixed(2)).toBe('200.00');
    expect(result.addons[0].unitPrice.toFixed(2)).toBe('100.00');
  });

  it('does not allow an unavailable existing add-on quantity to increase', async () => {
    const { service } = createService();
    const tx: any = {
      productAddon: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const current: any = {
      id: 4,
      productVariantId: 10,
      unitPrice: new Prisma.Decimal('1000'),
      productVariant: { productId: 5 },
      addons: [
        {
          addonId: 20,
          addonName: 'Milk',
          unitPrice: new Prisma.Decimal('100'),
          quantity: 1,
        },
      ],
    };

    await expect(
      (service as any).buildExistingItem(tx, current, {
        id: 4,
        productVariantId: 10,
        quantity: 1,
        addons: [{ addonId: 20, quantity: 2 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('captures the table name for a dine-in order', async () => {
    const { service } = createService();
    const tx: any = {
      diningTable: {
        findUnique: vi.fn().mockResolvedValue({
          id: 3,
          name: 'Table 3',
          isActive: true,
          orders: [],
        }),
      },
    };

    await expect(
      (service as any).resolveCreateAssignment(tx, {
        orderType: OrderType.DINE_IN,
        tableId: 3,
      }),
    ).resolves.toEqual({
      orderType: OrderType.DINE_IN,
      tableId: 3,
      tableName: 'Table 3',
    });
  });

  it('loads order details after the create transaction commits', async () => {
    const { service, prisma } = createService();
    const now = new Date();
    const order = {
      id: 42,
      tableId: null,
      createdById: 1,
      updatedById: 1,
      orderType: OrderType.TAKEAWAY,
      tableName: null,
      status: 'OPEN',
      subtotal: new Prisma.Decimal('1000'),
      discountType: null,
      discountValue: new Prisma.Decimal('0'),
      discountAmount: new Prisma.Decimal('0'),
      taxPercent: new Prisma.Decimal('0'),
      taxAmount: new Prisma.Decimal('0'),
      totalAmount: new Prisma.Decimal('1000'),
      completedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
      table: null,
      createdBy: { id: 1, name: 'Manager' },
      updatedBy: { id: 1, name: 'Manager' },
      _count: { items: 1 },
      items: [
        {
          id: 7,
          orderId: 42,
          productVariantId: 3,
          productName: 'Tea',
          variantName: 'Regular',
          unitPrice: new Prisma.Decimal('1000'),
          quantity: 1,
          baseSubtotal: new Prisma.Decimal('1000'),
          addonTotal: new Prisma.Decimal('0'),
          lineTotal: new Prisma.Decimal('1000'),
          productVariant: { productId: 2 },
          addons: [],
        },
      ],
    };
    const tx: any = {
      productVariant: {
        findUnique: vi.fn().mockResolvedValue({
          id: 3,
          name: 'Regular',
          price: new Prisma.Decimal('1000'),
          isActive: true,
          product: {
            id: 2,
            name: 'Tea',
            isActive: true,
            category: { isActive: true },
          },
        }),
      },
      order: { create: vi.fn().mockResolvedValue({ id: 42 }) },
    };
    prisma.$transaction = vi.fn((callback) => callback(tx));
    prisma.order.findUnique = vi.fn().mockResolvedValue(order);

    await expect(
      service.create(
        {
          orderType: OrderType.TAKEAWAY,
          items: [{ productVariantId: 3, quantity: 1, addons: [] }],
          taxPercent: '0',
        },
        { sub: 1 } as any,
      ),
    ).resolves.toMatchObject({ id: 42, totalAmount: '1000.00' });

    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({ select: { id: true } }),
    );
    expect(prisma.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
    expect(tx.order.create.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.order.findUnique.mock.invocationCallOrder[0],
    );
  });

  it('rejects an occupied table', async () => {
    const { service } = createService();
    const tx: any = {
      diningTable: {
        findUnique: vi.fn().mockResolvedValue({
          id: 3,
          name: 'Table 3',
          isActive: true,
          orders: [{ id: 9 }],
        }),
      },
    };

    await expect(
      (service as any).resolveCreateAssignment(tx, {
        orderType: OrderType.DINE_IN,
        tableId: 3,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('converts an open dine-in order to takeaway and clears its table', async () => {
    const { service } = createService();
    await expect(
      (service as any).resolveUpdateAssignment(
        {},
        {
          id: 8,
          orderType: OrderType.DINE_IN,
          tableId: 3,
          tableName: 'Table 3',
        },
        { orderType: OrderType.TAKEAWAY },
      ),
    ).resolves.toEqual({
      orderType: OrderType.TAKEAWAY,
      tableId: null,
      tableName: null,
    });
  });
});

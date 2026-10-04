import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DiscountType, UserRole } from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { OrderService } from './order.service.js';

const createService = (role: UserRole = UserRole.MANAGER) => {
  const actor = { id: 1, role, branchId: role === UserRole.MANAGER ? null : 2 };
  const prisma: any = {
    branch: { findUnique: vi.fn().mockResolvedValue({ isActive: true }) },
    order: { findFirst: vi.fn() },
  };
  const pagination: any = { paginateRawQuery: vi.fn() };
  const permission: any = {
    isGlobalRole: vi.fn().mockReturnValue(role === UserRole.MANAGER),
  };
  const users: any = { requireUser: vi.fn().mockResolvedValue(actor) };
  return {
    service: new OrderService(prisma, pagination, permission, users),
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

  it('defaults branch staff to their assigned branch', async () => {
    const { service } = createService(UserRole.CASHIER);
    await expect(
      (service as any).resolveCreateBranch(
        { id: 1, role: UserRole.CASHIER, branchId: 2 },
        undefined,
      ),
    ).resolves.toBe(2);
  });

  it('requires global operators to specify a branch', async () => {
    const { service } = createService();
    await expect(
      (service as any).resolveCreateBranch(
        { id: 1, role: UserRole.MANAGER, branchId: null },
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
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
});

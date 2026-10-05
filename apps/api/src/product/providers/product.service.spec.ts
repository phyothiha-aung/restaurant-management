import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../generated/prisma/enums.js';
import { ProductService } from './product.service.js';

const actor = { id: 1, role: UserRole.MANAGER };
const money = (value: string) => ({ toString: () => value });

const productRecord = {
  id: 10,
  categoryId: 2,
  code: null,
  name: 'Tea',
  description: null,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  category: { id: 2, name: 'Drinks', isActive: true },
  variants: [
    {
      id: 20,
      name: 'Small',
      price: money('1000'),
      sortOrder: 0,
      isActive: true,
    },
    {
      id: 21,
      name: 'Large',
      price: money('1500'),
      sortOrder: 1,
      isActive: true,
    },
  ],
  addonAssignments: [
    {
      maxQuantity: 2,
      sortOrder: 0,
      addon: { id: 30, name: 'Milk', unitPrice: money('300'), isActive: true },
    },
  ],
  image: null,
};

const createService = () => {
  const prisma: any = {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(productRecord),
      findUniqueOrThrow: vi.fn().mockResolvedValue(productRecord),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: productRecord.id }),
      update: vi.fn().mockResolvedValue(productRecord),
    },
    productVariant: {
      count: vi.fn().mockResolvedValue(1),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    productAddon: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    productCategory: {
      findUnique: vi.fn().mockResolvedValue({ id: 2, isActive: true }),
    },
    addon: { count: vi.fn().mockResolvedValue(1) },
  };
  prisma.$transaction = vi.fn(async (callback) => callback(prisma));
  const pagination: any = { paginateRawQuery: vi.fn() };
  const permission: any = {
    isUserManager: vi.fn().mockReturnValue(true),
    isManager: vi.fn().mockReturnValue(true),
  };
  const users: any = { requireUser: vi.fn().mockResolvedValue(actor) };
  return {
    service: new ProductService(prisma, pagination, permission, users),
    prisma,
    permission,
  };
};

describe('ProductService aggregate writes', () => {
  it('creates a product, variants, and reusable add-on assignments atomically', async () => {
    const { service, prisma } = createService();

    const result = await service.create(
      {
        categoryId: 2,
        code: null,
        name: 'Tea',
        description: null,
        sortOrder: 0,
        isActive: true,
        variants: [
          { name: 'Regular', price: '1000', sortOrder: 0, isActive: true },
        ],
        addons: [{ addonId: 30, maxQuantity: 2, sortOrder: 0 }],
      },
      { sub: actor.id } as any,
    );

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(prisma.productVariant.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: 10,
          name: 'Regular',
          price: '1000',
        }),
      ],
    });
    expect(prisma.productAddon.createMany).toHaveBeenCalledWith({
      data: [{ productId: 10, addonId: 30, maxQuantity: 2, sortOrder: 0 }],
    });
    expect(result.variants[0]?.price).toBe('1000');
    expect(result.addons[0]?.unitPrice).toBe('300');
  });

  it('soft-deactivates omitted variants and replaces assignments', async () => {
    const { service, prisma } = createService();

    await service.update(
      productRecord.id,
      {
        variants: [
          {
            id: 20,
            name: 'Small',
            price: '1100',
            sortOrder: 0,
            isActive: true,
          },
        ],
        addons: [{ addonId: 30, maxQuantity: 3, sortOrder: 1 }],
      },
      { sub: actor.id } as any,
    );

    expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
      where: { productId: 10, id: { notIn: [20] } },
      data: { isActive: false },
    });
    expect(prisma.productAddon.deleteMany).toHaveBeenCalledWith({
      where: { productId: 10 },
    });
    expect(prisma.productAddon.createMany).toHaveBeenCalledWith({
      data: [{ productId: 10, addonId: 30, maxQuantity: 3, sortOrder: 1 }],
    });
  });

  it('rejects foreign variant IDs before opening a transaction', async () => {
    const { service, prisma } = createService();
    prisma.productVariant.count.mockResolvedValue(0);

    await expect(
      service.update(
        10,
        {
          variants: [
            {
              id: 99,
              name: 'Other',
              price: '100',
              sortOrder: 0,
              isActive: true,
            },
          ],
        },
        { sub: actor.id } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects case-insensitive duplicate variant names', async () => {
    const { service, prisma } = createService();

    await expect(
      service.create(
        {
          categoryId: 2,
          code: null,
          name: 'Tea',
          description: null,
          sortOrder: 0,
          isActive: true,
          variants: [
            { name: 'Small', price: '1000', sortOrder: 0, isActive: true },
            { name: 'small', price: '1200', sortOrder: 1, isActive: true },
          ],
          addons: [],
        },
        { sub: actor.id } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('propagates transaction failure without returning a partial aggregate', async () => {
    const { service, prisma } = createService();
    prisma.$transaction.mockRejectedValue(new Error('transaction failed'));

    await expect(
      service.create(
        {
          categoryId: 2,
          code: null,
          name: 'Tea',
          description: null,
          sortOrder: 0,
          isActive: true,
          variants: [
            { name: 'Regular', price: '1000', sortOrder: 0, isActive: true },
          ],
          addons: [],
        },
        { sub: actor.id } as any,
      ),
    ).rejects.toThrow('transaction failed');
  });

  it('rejects active products without an active variant', async () => {
    const { service, prisma } = createService();

    await expect(
      service.update(10, { variants: [] }, { sub: actor.id } as any),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('denies product mutation when the actor is not a global manager', async () => {
    const { service, permission } = createService();
    permission.isManager.mockReturnValue(false);

    await expect(
      service.deactivate(10, { sub: actor.id } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ProductService central menu', () => {
  it('filters centrally and exposes string prices without branch input', async () => {
    const { service, prisma } = createService();
    prisma.product.findMany.mockResolvedValue([productRecord]);

    const result = await service.menu({ sub: actor.id } as any);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          category: { isActive: true },
          variants: { some: { isActive: true } },
        },
      }),
    );
    expect(result[0]?.variants[0]?.price).toBe('1000');
    expect(result[0]?.addons[0]?.unitPrice).toBe('300');
  });

  it('does not require manager permission for authenticated menu readers', async () => {
    const { service, prisma, permission } = createService();
    permission.isUserManager.mockReturnValue(false);
    permission.isManager.mockReturnValue(false);
    prisma.product.findMany.mockResolvedValue([]);

    await expect(service.menu({ sub: 99 } as any)).resolves.toEqual([]);
    expect(permission.isUserManager).not.toHaveBeenCalled();
    expect(permission.isManager).not.toHaveBeenCalled();
  });
});

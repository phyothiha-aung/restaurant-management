import { ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../generated/prisma/enums.js';
import { ProductCategoryService } from './product-category.service.js';

const category = {
  id: 1,
  name: 'Drinks',
  description: null,
  sortOrder: 2,
  isActive: true,
  createdAt: new Date('2026-09-22T00:00:00.000Z'),
  updatedAt: new Date('2026-09-22T00:00:00.000Z'),
};

const createService = (role = UserRole.MANAGER) => {
  const prisma: any = {
    productCategory: {
      findMany: vi.fn().mockResolvedValue([category]),
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn().mockResolvedValue(category),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(category),
      update: vi.fn().mockResolvedValue(category),
    },
  };
  const pagination: any = {
    paginateRawQuery: vi.fn(async (_query, fetch, count) => ({
      data: await fetch(0, 10),
      meta: { totalItems: await count() },
      links: {},
    })),
  };
  const permission: any = {
    isUserManager: vi.fn().mockReturnValue(
      role === UserRole.MANAGER || role === UserRole.BRANCH_MANAGER,
    ),
    isBranchManager: vi.fn().mockReturnValue(role === UserRole.MANAGER),
  };
  const users: any = {
    requireUser: vi.fn().mockResolvedValue({ id: 1, role }),
  };
  return {
    service: new ProductCategoryService(prisma, pagination, permission, users),
    prisma,
  };
};

const request = {
  headers: { host: 'localhost' },
  protocol: 'http',
  url: '/api/product-categories',
} as any;

describe('ProductCategoryService', () => {
  it('applies the same search and status filter to list and count', async () => {
    const { service, prisma } = createService();
    await service.findAll(
      { page: 1, limit: 10, search: 'drink', isActive: true },
      { sub: 1 } as any,
      request,
    );
    expect(prisma.productCategory.count.mock.calls[0][0].where).toEqual(
      prisma.productCategory.findMany.mock.calls[0][0].where,
    );
    expect(prisma.productCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );
  });

  it('allows branch managers to read but not mutate categories', async () => {
    const { service } = createService(UserRole.BRANCH_MANAGER);
    await expect(service.findOne(1, { sub: 1 } as any)).resolves.toEqual(category);
    await expect(
      service.create({ name: 'Rice', sortOrder: 0, isActive: true }, { sub: 1 } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects category names case-insensitively', async () => {
    const { service, prisma } = createService();
    prisma.productCategory.findFirst.mockResolvedValue({ id: 2 });
    await expect(
      service.create({ name: 'drinks', sortOrder: 0, isActive: true }, { sub: 1 } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates categories idempotently', async () => {
    const { service, prisma } = createService();
    prisma.productCategory.findUnique.mockResolvedValue({ ...category, isActive: false });
    await expect(service.deactivate(1, { sub: 1 } as any)).resolves.toMatchObject({
      isActive: false,
    });
    expect(prisma.productCategory.update).not.toHaveBeenCalled();
  });
});

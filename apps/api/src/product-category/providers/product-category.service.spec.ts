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
      findUnique: vi.fn().mockResolvedValue(category),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(category),
      update: vi.fn().mockResolvedValue(category),
    },
  };
  const permission: any = {
    isUserManager: vi.fn().mockReturnValue(role === UserRole.MANAGER),
    isManager: vi.fn().mockReturnValue(role === UserRole.MANAGER),
  };
  const users: any = {
    requireUser: vi.fn().mockResolvedValue({ id: 1, role }),
  };
  return {
    service: new ProductCategoryService(prisma, permission, users),
    prisma,
  };
};

describe('ProductCategoryService', () => {
  it('returns every matching category in display order without a count query', async () => {
    const { service, prisma } = createService();
    await expect(
      service.findAll(
        { search: 'drink', isActive: true },
        { sub: 1 } as any,
      ),
    ).resolves.toEqual([category]);
    expect(prisma.productCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'drink', mode: 'insensitive' } },
            { description: { contains: 'drink', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );
  });

  it('denies category management access to operational users', async () => {
    const { service } = createService(UserRole.CASHIER);
    await expect(
      service.findOne(1, { sub: 1 } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
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

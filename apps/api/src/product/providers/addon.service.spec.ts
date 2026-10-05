import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../generated/prisma/enums.js';
import { AddonService } from './addon.service.js';

const addon = {
  id: 4,
  name: 'Extra cheese',
  unitPrice: { toString: () => '500' },
  isActive: true,
  createdAt: new Date('2026-09-29T00:00:00.000Z'),
  updatedAt: new Date('2026-09-29T00:00:00.000Z'),
  _count: { productAssignments: 3 },
};

const createService = () => {
  const prisma: any = {
    addon: {
      findUnique: vi.fn().mockResolvedValue(addon),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(addon),
      update: vi.fn().mockResolvedValue({ ...addon, isActive: false }),
    },
  };
  const pagination: any = {};
  const permission: any = {
    isUserManager: vi.fn().mockReturnValue(true),
    isManager: vi.fn().mockReturnValue(true),
  };
  const users: any = {
    requireUser: vi.fn().mockResolvedValue({
      id: 1,
      role: UserRole.MANAGER,
    }),
  };
  return {
    service: new AddonService(prisma, pagination, permission, users),
    prisma,
    permission,
  };
};

describe('AddonService', () => {
  it('returns string prices and the number of assigned products', async () => {
    const { service } = createService();

    const result = await service.findOne(4, { sub: 1 } as any);

    expect(result.unitPrice).toBe('500');
    expect(result.productCount).toBe(3);
  });

  it('soft-deactivates an add-on without deleting product assignments', async () => {
    const { service, prisma } = createService();

    const result = await service.deactivate(4, { sub: 1 } as any);

    expect(prisma.addon.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 4 },
        data: { isActive: false },
      }),
    );
    expect(result.isActive).toBe(false);
    expect(prisma.productAddon).toBeUndefined();
  });

  it('denies mutation to operational users', async () => {
    const { service, permission } = createService();
    permission.isManager.mockReturnValue(false);

    await expect(
      service.create({ name: 'Milk', unitPrice: '300', isActive: true }, {
        sub: 1,
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

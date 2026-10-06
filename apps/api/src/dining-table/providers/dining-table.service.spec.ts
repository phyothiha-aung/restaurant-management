import { ConflictException, ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../generated/prisma/enums.js';
import { DiningTableService } from './dining-table.service.js';

const record = {
  id: 1,
  name: 'Table 1',
  capacity: 4,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  orders: [],
};

const createService = (role = UserRole.MANAGER) => {
  const prisma: any = {
    diningTable: {
      findUnique: vi.fn().mockResolvedValue(record),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(record),
      update: vi.fn().mockResolvedValue(record),
    },
  };
  const permission: any = { isManager: vi.fn().mockReturnValue(role === UserRole.MANAGER) };
  const users: any = { requireUser: vi.fn().mockResolvedValue({ id: 1, role }) };
  return {
    service: new DiningTableService(prisma, {} as any, permission, users),
    prisma,
  };
};

describe('DiningTableService', () => {
  it('allows all authenticated staff to view a table', async () => {
    const { service } = createService(UserRole.CHEF);
    await expect(service.findOne(1, { sub: 1 } as any)).resolves.toMatchObject({
      status: 'AVAILABLE',
    });
  });

  it('denies operational users from creating tables', async () => {
    const { service } = createService(UserRole.WAITER);
    await expect(
      service.create({ name: 'Patio', sortOrder: 0, isActive: true }, { sub: 1 } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks deactivation while an open order occupies the table', async () => {
    const { service, prisma } = createService();
    prisma.diningTable.findUnique.mockResolvedValue({
      ...record,
      orders: [{ id: 9, totalAmount: { toFixed: () => '1000.00' }, createdAt: new Date() }],
    });
    await expect(service.deactivate(1, { sub: 1 } as any)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.diningTable.update).not.toHaveBeenCalled();
  });
});

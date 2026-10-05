import { ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  ExpenseCategory,
  ExpenseStatus,
  UserRole,
} from '../../generated/prisma/enums.js';
import { ExpenseService } from './expense.service.js';

const actor = {
  id: 10,
  role: UserRole.MANAGER,
};

const expense = {
  id: 5,
  createdById: actor.id,
  updatedById: actor.id,
  voidedById: null,
  title: 'Cooking oil',
  description: null,
  category: ExpenseCategory.INGREDIENTS,
  amount: { toFixed: () => '125000.00' },
  expenseDate: new Date('2026-09-22T00:00:00.000Z'),
  status: ExpenseStatus.ACTIVE,
  voidReason: null,
  voidedAt: null,
  createdAt: new Date('2026-09-22T00:00:00.000Z'),
  updatedAt: new Date('2026-09-22T00:00:00.000Z'),
  createdBy: { id: actor.id, name: 'Manager' },
  updatedBy: { id: actor.id, name: 'Manager' },
  voidedBy: null,
  _count: { attachments: 0 },
  attachments: [],
};

const createService = (overrides: Record<string, unknown> = {}) => {
  const prisma: any = {
    expense: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findFirst: vi.fn().mockResolvedValue(expense),
      findUnique: vi.fn().mockResolvedValue(expense),
      create: vi.fn().mockResolvedValue(expense),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  prisma.$transaction = vi.fn(async (callback) => callback(prisma));
  Object.assign(prisma, overrides);

  const pagination: any = {
    paginateRawQuery: vi.fn(async (_query, fetch, count) => ({
      data: await fetch(0, 10),
      meta: {
        itemsPerPage: 10,
        totalItems: await count(),
        currentPage: 1,
        totalPages: 1,
      },
      links: {},
    })),
  };
  const permission: any = {
    isUserManager: vi.fn().mockReturnValue(true),
  };
  const users: any = { requireUser: vi.fn().mockResolvedValue(actor) };
  const expenseAttachments: any = {
    prepareFiles: vi.fn().mockResolvedValue([]),
    retainFiles: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new ExpenseService(
      prisma,
      pagination,
      permission,
      users,
      expenseAttachments,
    ),
    prisma,
    expenseAttachments,
  };
};

describe('ExpenseService', () => {
  it('creates restaurant-wide expenses with audit users', async () => {
    const { service, prisma } = createService();

    await service.create(
      {
        title: 'Cooking oil',
        description: null,
        category: ExpenseCategory.INGREDIENTS,
        amount: '125000',
        expenseDate: '2026-09-22',
      },
      { sub: actor.id } as any,
    );

    expect(prisma.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: actor.id,
          updatedById: actor.id,
        }),
      }),
    );
  });

  it('applies requested filters identically to list and count', async () => {
    const { service, prisma } = createService();

    await service.findAll(
      {
        page: 1,
        limit: 10,
        search: 'oil',
        category: ExpenseCategory.INGREDIENTS,
        status: ExpenseStatus.ACTIVE,
      },
      { sub: actor.id } as any,
      { headers: { host: 'localhost' }, protocol: 'http', url: '' } as any,
    );

    const listWhere = prisma.expense.findMany.mock.calls[0][0].where;
    const countWhere = prisma.expense.count.mock.calls[0][0].where;
    expect(countWhere).toEqual(listWhere);
    expect(listWhere.AND).toEqual(
      expect.arrayContaining([
        { status: ExpenseStatus.ACTIVE },
        { category: ExpenseCategory.INGREDIENTS },
      ]),
    );
  });

  it('returns not found for unknown records', async () => {
    const { service, prisma } = createService();
    prisma.expense.findUnique.mockResolvedValue(null);

    await expect(service.findOne(99, { sub: actor.id } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.expense.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 99 } }),
    );
  });

  it('rejects updates to voided expenses', async () => {
    const { service, prisma } = createService();
    prisma.expense.findUnique.mockResolvedValue({
      ...expense,
      status: ExpenseStatus.VOIDED,
    });

    await expect(
      service.update(
        expense.id,
        { title: 'Updated title' },
        { sub: actor.id } as any,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns an existing voided record without overwriting audit data', async () => {
    const { service, prisma } = createService();
    prisma.expense.findUnique.mockResolvedValue({
      ...expense,
      status: ExpenseStatus.VOIDED,
      voidReason: 'Original reason',
    });

    const result = await service.void(
      expense.id,
      { reason: 'Different reason' },
      { sub: actor.id } as any,
    );

    expect(result.voidReason).toBe('Original reason');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

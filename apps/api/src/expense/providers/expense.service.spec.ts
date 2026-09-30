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
  branchId: 1,
  role: UserRole.BRANCH_MANAGER,
};

const expense = {
  id: 5,
  branchId: 1,
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
  branch: { id: 1, branchCode: 'MAIN', name: 'Main', isActive: true },
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
    branch: {
      findUnique: vi.fn().mockResolvedValue({ isActive: true }),
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
    isGlobalRole: vi.fn((role) => role !== UserRole.BRANCH_MANAGER),
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
  it('defaults branch-manager creations to the assigned branch', async () => {
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
          branchId: actor.branchId,
          createdById: actor.id,
          updatedById: actor.id,
        }),
      }),
    );
  });

  it('applies actor scope and requested filters to list and count', async () => {
    const { service, prisma } = createService();

    await service.findAll(
      {
        page: 1,
        limit: 10,
        search: 'oil',
        category: ExpenseCategory.INGREDIENTS,
        status: ExpenseStatus.ACTIVE,
        branchId: 2,
      },
      { sub: actor.id } as any,
      { headers: { host: 'localhost' }, protocol: 'http', url: '' } as any,
    );

    const listWhere = prisma.expense.findMany.mock.calls[0][0].where;
    const countWhere = prisma.expense.count.mock.calls[0][0].where;
    expect(countWhere).toEqual(listWhere);
    expect(listWhere.AND).toEqual(
      expect.arrayContaining([{ branchId: 1 }, { branchId: 2 }]),
    );
  });

  it('returns not found for records outside the actor scope', async () => {
    const { service, prisma } = createService();
    prisma.expense.findFirst.mockResolvedValue(null);

    await expect(service.findOne(99, { sub: actor.id } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.expense.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 99, branchId: 1 } }),
    );
  });

  it('rejects updates to voided expenses', async () => {
    const { service, prisma } = createService();
    prisma.expense.findFirst.mockResolvedValue({
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
    prisma.expense.findFirst.mockResolvedValue({
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

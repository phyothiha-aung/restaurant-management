import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginationProvider } from '../../common/pagination/providers/pagination.provider.js';
import { PermissionProvider } from '../../user/providers/permission.provider.js';
import { UserService } from '../../user/providers/user.service.js';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { ExpenseStatus } from '../../generated/prisma/enums.js';
import type {
  Prisma,
  User,
} from '../../generated/prisma/client.js';
import { CreateExpenseDto } from '../dtos/create-expense.dto.js';
import { UpdateExpenseDto } from '../dtos/update-expense.dto.js';
import { VoidExpenseDto } from '../dtos/void-expense.dto.js';
import { ExpenseQueryDto } from '../dtos/expense-query.dto.js';
import { toExpenseDate } from '../dtos/expense-validation.js';

const expenseSelect = {
  id: true,
  branchId: true,
  createdById: true,
  updatedById: true,
  voidedById: true,
  title: true,
  description: true,
  category: true,
  amount: true,
  expenseDate: true,
  status: true,
  voidReason: true,
  voidedAt: true,
  createdAt: true,
  updatedAt: true,
  branch: {
    select: {
      id: true,
      branchCode: true,
      name: true,
      isActive: true,
    },
  },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  voidedBy: { select: { id: true, name: true } },
} satisfies Prisma.ExpenseSelect;

type ExpenseRecord = Prisma.ExpenseGetPayload<{
  select: typeof expenseSelect;
}>;

const toExpenseResponse = (expense: ExpenseRecord) => ({
  ...expense,
  amount: expense.amount.toFixed(2),
  expenseDate: expense.expenseDate.toISOString().slice(0, 10),
});

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async findAll(
    query: ExpenseQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    const actor = await this.requireExpenseManager(activeUser.sub);
    const filters: Prisma.ExpenseWhereInput[] = [
      { status: query.status },
    ];

    if (!this.permission.isGlobalRole(actor.role)) {
      filters.push({ branchId: actor.branchId ?? -1 });
    }
    if (query.branchId) filters.push({ branchId: query.branchId });
    if (query.category) filters.push({ category: query.category });
    if (query.dateFrom || query.dateTo) {
      filters.push({
        expenseDate: {
          ...(query.dateFrom && { gte: toExpenseDate(query.dateFrom) }),
          ...(query.dateTo && { lte: toExpenseDate(query.dateTo) }),
        },
      });
    }
    if (query.search) {
      filters.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.ExpenseWhereInput = { AND: filters };
    const result = await this.pagination.paginateRawQuery<ExpenseRecord>(
      query,
      (skip, take) =>
        this.prisma.expense.findMany({
          where,
          select: expenseSelect,
          orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
          skip,
          take,
        }),
      () => this.prisma.expense.count({ where }),
      request,
    );

    return { ...result, data: result.data.map(toExpenseResponse) };
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    const actor = await this.requireExpenseManager(activeUser.sub);
    const expense = await this.requireScopedExpense(id, actor);
    return toExpenseResponse(expense);
  }

  async create(dto: CreateExpenseDto, activeUser: ActiveUserDto) {
    const actor = await this.requireExpenseManager(activeUser.sub);
    const branchId = await this.resolveCreateBranch(actor, dto.branchId);
    const expense = await this.prisma.expense.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category,
        amount: dto.amount,
        expenseDate: toExpenseDate(dto.expenseDate),
        branchId,
        createdById: actor.id,
        updatedById: actor.id,
      },
      select: expenseSelect,
    });
    return toExpenseResponse(expense);
  }

  async update(
    id: number,
    dto: UpdateExpenseDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireExpenseManager(activeUser.sub);
    const current = await this.requireScopedExpense(id, actor);
    if (current.status === ExpenseStatus.VOIDED) {
      throw new ConflictException('Voided expenses cannot be updated');
    }

    const branchId = await this.resolveUpdateBranch(
      actor,
      current.branchId,
      dto.branchId,
    );
    const { amount, expenseDate, branchId: _branchId, ...values } = dto;

    const expense = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.expense.updateMany({
        where: { id, status: ExpenseStatus.ACTIVE },
        data: {
          ...values,
          ...(amount !== undefined && { amount }),
          ...(expenseDate !== undefined && {
            expenseDate: toExpenseDate(expenseDate),
          }),
          branchId,
          updatedById: actor.id,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException('Voided expenses cannot be updated');
      }
      return transaction.expense.findUnique({
        where: { id },
        select: expenseSelect,
      });
    });

    if (!expense) throw new NotFoundException('Expense not found');
    return toExpenseResponse(expense);
  }

  async void(
    id: number,
    dto: VoidExpenseDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireExpenseManager(activeUser.sub);
    const current = await this.requireScopedExpense(id, actor);
    if (current.status === ExpenseStatus.VOIDED) {
      return toExpenseResponse(current);
    }

    const expense = await this.prisma.$transaction(async (transaction) => {
      await transaction.expense.updateMany({
        where: { id, status: ExpenseStatus.ACTIVE },
        data: {
          status: ExpenseStatus.VOIDED,
          voidReason: dto.reason,
          voidedAt: new Date(),
          voidedById: actor.id,
          updatedById: actor.id,
        },
      });
      return transaction.expense.findUnique({
        where: { id },
        select: expenseSelect,
      });
    });

    if (!expense) throw new NotFoundException('Expense not found');
    return toExpenseResponse(expense);
  }

  private async requireExpenseManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage expenses',
      );
    }
    return actor;
  }

  private async requireScopedExpense(id: number, actor: User) {
    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        ...(!this.permission.isGlobalRole(actor.role) && {
          branchId: actor.branchId ?? -1,
        }),
      },
      select: expenseSelect,
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  private async resolveCreateBranch(
    actor: User,
    requestedBranchId: number | null | undefined,
  ) {
    if (this.permission.isGlobalRole(actor.role)) {
      if (requestedBranchId === null || requestedBranchId === undefined) {
        return null;
      }
      await this.requireActiveBranch(requestedBranchId);
      return requestedBranchId;
    }

    if (
      !actor.branchId ||
      requestedBranchId === null ||
      (requestedBranchId !== undefined && requestedBranchId !== actor.branchId)
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage this branch',
      );
    }
    await this.requireActiveBranch(actor.branchId);
    return actor.branchId;
  }

  private async resolveUpdateBranch(
    actor: User,
    currentBranchId: number | null,
    requestedBranchId: number | null | undefined,
  ) {
    if (requestedBranchId === undefined || requestedBranchId === currentBranchId) {
      return currentBranchId;
    }
    if (!this.permission.isGlobalRole(actor.role)) {
      throw new ForbiddenException('Branch managers cannot reassign expenses');
    }
    if (requestedBranchId === null) return null;
    await this.requireActiveBranch(requestedBranchId);
    return requestedBranchId;
  }

  private async requireActiveBranch(id: number) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.isActive) throw new ForbiddenException('Branch is inactive');
  }
}

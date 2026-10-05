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
import type { Prisma } from '../../generated/prisma/client.js';
import { CreateExpenseDto } from '../dtos/create-expense.dto.js';
import { UpdateExpenseDto } from '../dtos/update-expense.dto.js';
import { VoidExpenseDto } from '../dtos/void-expense.dto.js';
import { ExpenseQueryDto } from '../dtos/expense-query.dto.js';
import { toExpenseDate } from '../dtos/expense-validation.js';
import {
  attachmentSelect,
  ExpenseAttachmentService,
  toAttachmentResponse,
} from './expense-attachment.service.js';

const expenseSelect = {
  id: true,
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
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  voidedBy: { select: { id: true, name: true } },
  _count: { select: { attachments: true } },
  attachments: {
    select: attachmentSelect,
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ExpenseSelect;

type ExpenseRecord = Prisma.ExpenseGetPayload<{
  select: typeof expenseSelect;
}>;

const toExpenseResponse = (expense: ExpenseRecord) => {
  const { _count, attachments, ...values } = expense;
  return {
    ...values,
    amount: expense.amount.toFixed(2),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    attachmentCount: _count.attachments,
    attachments: attachments.map(toAttachmentResponse),
  };
};

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
    private readonly expenseAttachments: ExpenseAttachmentService,
  ) {}

  async findAll(
    query: ExpenseQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    await this.requireExpenseManager(activeUser.sub);
    const filters: Prisma.ExpenseWhereInput[] = [
      { status: query.status },
    ];

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
    await this.requireExpenseManager(activeUser.sub);
    const expense = await this.requireExpense(id);
    return toExpenseResponse(expense);
  }

  async create(dto: CreateExpenseDto, activeUser: ActiveUserDto) {
    const actor = await this.requireExpenseManager(activeUser.sub);
    const attachmentIds = dto.attachmentIds ?? [];
    const files = await this.expenseAttachments.prepareFiles(
      attachmentIds,
      actor.id,
    );
    await this.expenseAttachments.retainFiles(files);
    const created = await this.prisma.expense.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category,
        amount: dto.amount,
        expenseDate: toExpenseDate(dto.expenseDate),
        createdById: actor.id,
        updatedById: actor.id,
        ...(files.length > 0 && {
          attachments: {
            create: files.map((file) => ({
              fileId: file.id,
              attachedById: actor.id,
            })),
          },
        }),
      },
      select: { id: true },
    });
    const expense = await this.requireExpense(created.id);
    return toExpenseResponse(expense);
  }

  async update(
    id: number,
    dto: UpdateExpenseDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireExpenseManager(activeUser.sub);
    const current = await this.requireExpense(id);
    if (current.status === ExpenseStatus.VOIDED) {
      throw new ConflictException('Voided expenses cannot be updated');
    }

    const { amount, expenseDate, ...values } = dto;

    const expense = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.expense.updateMany({
        where: { id, status: ExpenseStatus.ACTIVE },
        data: {
          ...values,
          ...(amount !== undefined && { amount }),
          ...(expenseDate !== undefined && {
            expenseDate: toExpenseDate(expenseDate),
          }),
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
    const current = await this.requireExpense(id);
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

  private async requireExpense(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: expenseSelect,
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

}

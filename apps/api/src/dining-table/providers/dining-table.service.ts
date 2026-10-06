import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { OrderStatus } from '../../generated/prisma/enums.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PermissionProvider } from '../../user/providers/permission.provider.js';
import { UserService } from '../../user/providers/user.service.js';
import { CreateDiningTableDto } from '../dtos/create-dining-table.dto.js';
import { DiningTableQueryDto } from '../dtos/dining-table-query.dto.js';
import { UpdateDiningTableDto } from '../dtos/update-dining-table.dto.js';

const openOrderSelect = {
  id: true,
  totalAmount: true,
  createdAt: true,
} satisfies Prisma.OrderSelect;

const diningTableSelect = {
  id: true,
  name: true,
  capacity: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  orders: {
    where: { status: OrderStatus.OPEN },
    select: openOrderSelect,
    take: 1,
  },
} satisfies Prisma.DiningTableSelect;

type DiningTableRecord = Prisma.DiningTableGetPayload<{
  select: typeof diningTableSelect;
}>;

const toResponse = (table: DiningTableRecord) => {
  const { orders, ...values } = table;
  const order = orders[0];
  return {
    ...values,
    status: !table.isActive
      ? ('INACTIVE' as const)
      : order
        ? ('OCCUPIED' as const)
        : ('AVAILABLE' as const),
    openOrder: order
      ? { ...order, totalAmount: order.totalAmount.toFixed(2) }
      : null,
  };
};

@Injectable()
export class DiningTableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async findAll(
    query: DiningTableQueryDto,
    activeUser: ActiveUserDto,
  ) {
    await this.users.requireUser(activeUser.sub);
    const filters: Prisma.DiningTableWhereInput[] = [];
    if (query.search) {
      filters.push({ name: { contains: query.search, mode: 'insensitive' } });
    }
    if (query.status === 'AVAILABLE') {
      filters.push({
        isActive: true,
        orders: { none: { status: OrderStatus.OPEN } },
      });
    } else if (query.status === 'OCCUPIED') {
      filters.push({
        isActive: true,
        orders: { some: { status: OrderStatus.OPEN } },
      });
    } else if (query.status === 'INACTIVE') {
      filters.push({ isActive: false });
    }
    const where: Prisma.DiningTableWhereInput = { AND: filters };
    const tables = await this.prisma.diningTable.findMany({
      where,
      select: diningTableSelect,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return tables.map(toResponse);
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    await this.users.requireUser(activeUser.sub);
    return toResponse(await this.requireTable(id));
  }

  async create(dto: CreateDiningTableDto, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    await this.assertUniqueName(dto.name);
    try {
      const table = await this.prisma.diningTable.create({
        data: dto,
        select: diningTableSelect,
      });
      return toResponse(table);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(
    id: number,
    dto: UpdateDiningTableDto,
    activeUser: ActiveUserDto,
  ) {
    await this.requireManager(activeUser.sub);
    const current = await this.requireTable(id);
    if (dto.name) await this.assertUniqueName(dto.name, id);
    if (dto.isActive === false && current.isActive && current.orders.length) {
      throw new ConflictException(
        'Complete, cancel, or transfer the open order before deactivating this table',
      );
    }
    try {
      const table = await this.prisma.diningTable.update({
        where: { id },
        data: dto,
        select: diningTableSelect,
      });
      return toResponse(table);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivate(id: number, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    const table = await this.requireTable(id);
    if (!table.isActive) return toResponse(table);
    if (table.orders.length) {
      throw new ConflictException(
        'Complete, cancel, or transfer the open order before deactivating this table',
      );
    }
    const updated = await this.prisma.diningTable.update({
      where: { id },
      data: { isActive: false },
      select: diningTableSelect,
    });
    return toResponse(updated);
  }

  private async requireManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage restaurant tables',
      );
    }
  }

  private async requireTable(id: number) {
    const table = await this.prisma.diningTable.findUnique({
      where: { id },
      select: diningTableSelect,
    });
    if (!table) throw new NotFoundException('Restaurant table not found');
    return table;
  }

  private async assertUniqueName(name: string, excludeId?: number) {
    const table = await this.prisma.diningTable.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (table) {
      throw new ConflictException('A restaurant table with this name already exists');
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A restaurant table with this name already exists',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Restaurant table not found');
      }
    }
    throw error;
  }
}

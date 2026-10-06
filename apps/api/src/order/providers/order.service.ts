import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { Request } from 'express';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { PaginationProvider } from '../../common/pagination/providers/pagination.provider.js';
import {
  DiscountType,
  OrderStatus,
  OrderType,
  UserRole,
} from '../../generated/prisma/enums.js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserService } from '../../user/providers/user.service.js';
import {
  CreateOrderDto,
  OrderItemInputSchema,
  type OrderDiscountSchema,
} from '../dtos/create-order.dto.js';
import { OrderQueryDto } from '../dtos/order-query.dto.js';
import {
  toOrderDateEndExclusive,
  toOrderDateStart,
} from '../dtos/order-validation.js';
import { UpdateOrderDto } from '../dtos/update-order.dto.js';
import type { z } from '../../common/lib/zod.js';

type ItemInput = z.infer<typeof OrderItemInputSchema>;
type DiscountInput = z.infer<typeof OrderDiscountSchema>;

const orderOperators = new Set<UserRole>([
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
]);

const userSummary = { select: { id: true, name: true } } as const;
const tableSummary = {
  select: { id: true, name: true, capacity: true, isActive: true },
} as const;
const orderSummarySelect = {
  id: true,
  tableId: true,
  createdById: true,
  updatedById: true,
  orderType: true,
  tableName: true,
  status: true,
  subtotal: true,
  discountType: true,
  discountValue: true,
  discountAmount: true,
  taxPercent: true,
  taxAmount: true,
  totalAmount: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  table: tableSummary,
  createdBy: userSummary,
  updatedBy: userSummary,
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect;

const orderDetailSelect = {
  ...orderSummarySelect,
  items: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      orderId: true,
      productVariantId: true,
      productName: true,
      variantName: true,
      unitPrice: true,
      quantity: true,
      baseSubtotal: true,
      addonTotal: true,
      lineTotal: true,
      productVariant: { select: { productId: true } },
      addons: {
        orderBy: { addonName: 'asc' },
        select: {
          orderItemId: true,
          addonId: true,
          addonName: true,
          unitPrice: true,
          quantity: true,
          totalAmount: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type OrderSummaryRecord = Prisma.OrderGetPayload<{
  select: typeof orderSummarySelect;
}>;
type OrderDetailRecord = Prisma.OrderGetPayload<{
  select: typeof orderDetailSelect;
}>;
type CurrentItem = OrderDetailRecord['items'][number];

const money = (value: Prisma.Decimal) => value.toFixed(2);
const toOrderSummary = (order: OrderSummaryRecord) => {
  const { _count, ...values } = order;
  return {
    ...values,
    subtotal: money(order.subtotal),
    discountValue: money(order.discountValue),
    discountAmount: money(order.discountAmount),
    taxPercent: money(order.taxPercent),
    taxAmount: money(order.taxAmount),
    totalAmount: money(order.totalAmount),
    itemCount: _count.items,
  };
};

const toOrderDetail = (order: OrderDetailRecord) => ({
  ...toOrderSummary(order),
  items: order.items.map(({ productVariant: _variant, ...item }) => ({
    ...item,
    unitPrice: money(item.unitPrice),
    baseSubtotal: money(item.baseSubtotal),
    addonTotal: money(item.addonTotal),
    lineTotal: money(item.lineTotal),
    addons: item.addons.map((addon) => ({
      ...addon,
      unitPrice: money(addon.unitPrice),
      totalAmount: money(addon.totalAmount),
    })),
  })),
});

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly users: UserService,
  ) {}

  async findAll(
    query: OrderQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    await this.users.requireUser(activeUser.sub);
    const filters: Prisma.OrderWhereInput[] = [];
    if (query.status) filters.push({ status: query.status });
    if (query.orderType) filters.push({ orderType: query.orderType });
    if (query.tableId) filters.push({ tableId: query.tableId });
    if (query.createdById) filters.push({ createdById: query.createdById });
    if (query.dateFrom || query.dateTo) {
      filters.push({
        createdAt: {
          ...(query.dateFrom && { gte: toOrderDateStart(query.dateFrom) }),
          ...(query.dateTo && { lt: toOrderDateEndExclusive(query.dateTo) }),
        },
      });
    }
    const where: Prisma.OrderWhereInput = { AND: filters };
    const result = await this.pagination.paginateRawQuery<OrderSummaryRecord>(
      query,
      (skip, take) =>
        this.prisma.order.findMany({
          where,
          select: orderSummarySelect,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      () => this.prisma.order.count({ where }),
      request,
    );
    return { ...result, data: result.data.map(toOrderSummary) };
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    await this.users.requireUser(activeUser.sub);
    return toOrderDetail(await this.requireOrder(id));
  }

  async create(dto: CreateOrderDto, activeUser: ActiveUserDto) {
    const actor = await this.requireOperator(activeUser.sub);
    return this.runSerializable(async (tx) => {
      const assignment = await this.resolveCreateAssignment(tx, dto);
      const items = [];
      for (const item of dto.items) {
        items.push(await this.buildNewItem(tx, item));
      }
      const totals = this.calculateOrder(
        items.map((item) => item.lineTotal),
        dto.discount ?? null,
        dto.taxPercent,
      );
      const created = await tx.order.create({
        data: {
          ...assignment,
          createdById: actor.id,
          updatedById: actor.id,
          ...totals,
          items: { create: items.map((item) => item.data) },
        },
        select: orderDetailSelect,
      });
      return toOrderDetail(created);
    });
  }

  async update(id: number, dto: UpdateOrderDto, activeUser: ActiveUserDto) {
    const actor = await this.requireOperator(activeUser.sub);
    await this.requireOrder(id);
    return this.runSerializable(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        select: orderDetailSelect,
      });
      if (!current) throw new NotFoundException('Order not found');
      if (current.status !== OrderStatus.OPEN) {
        throw new ConflictException('Only open orders can be updated');
      }

      const assignment = await this.resolveUpdateAssignment(tx, current, dto);

      if (dto.items !== undefined) {
        await this.replaceItems(tx, current, dto.items);
      }
      const storedItems = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { lineTotal: true },
      });
      if (storedItems.length === 0) {
        throw new BadRequestException('An order requires at least one item');
      }
      const discount =
        dto.discount === undefined
          ? current.discountType
            ? {
                type: current.discountType,
                value: current.discountValue.toString(),
              }
            : null
          : dto.discount;
      const totals = this.calculateOrder(
        storedItems.map((item) => item.lineTotal),
        discount,
        dto.taxPercent ?? current.taxPercent.toString(),
      );
      const updated = await tx.order.update({
        where: { id },
        data: { ...totals, ...assignment, updatedById: actor.id },
        select: orderDetailSelect,
      });
      return toOrderDetail(updated);
    });
  }

  async complete(id: number, activeUser: ActiveUserDto) {
    return this.transition(id, OrderStatus.COMPLETED, activeUser);
  }

  async cancel(id: number, activeUser: ActiveUserDto) {
    return this.transition(id, OrderStatus.CANCELLED, activeUser);
  }

  private async transition(
    id: number,
    target: OrderStatus,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireOperator(activeUser.sub);
    const scoped = await this.requireOrder(id);
    if (scoped.status === target) return toOrderDetail(scoped);
    if (scoped.status !== OrderStatus.OPEN) {
      throw new ConflictException(
        `A ${scoped.status.toLowerCase()} order cannot be changed`,
      );
    }
    return this.runSerializable(async (tx) => {
      const changed = await tx.order.updateMany({
        where: { id, status: OrderStatus.OPEN },
        data: {
          status: target,
          updatedById: actor.id,
          ...(target === OrderStatus.COMPLETED
            ? { completedAt: new Date() }
            : { cancelledAt: new Date() }),
        },
      });
      const order = await tx.order.findUnique({
        where: { id },
        select: orderDetailSelect,
      });
      if (!order) throw new NotFoundException('Order not found');
      if (changed.count !== 1 && order.status !== target) {
        throw new ConflictException('Order status changed concurrently');
      }
      return toOrderDetail(order);
    });
  }

  private async replaceItems(
    tx: Prisma.TransactionClient,
    order: OrderDetailRecord,
    inputs: ItemInput[],
  ) {
    const currentById = new Map(order.items.map((item) => [item.id, item]));
    const retainedIds = inputs.flatMap((item) => (item.id ? [item.id] : []));
    for (const input of inputs) {
      if (input.id && !currentById.has(input.id)) {
        throw new BadRequestException(
          'One or more items do not belong to this order',
        );
      }
    }
    const removedIds = order.items
      .filter((item) => !retainedIds.includes(item.id))
      .map((item) => item.id);
    if (removedIds.length > 0) {
      await tx.orderItemAddon.deleteMany({
        where: { orderItemId: { in: removedIds } },
      });
      await tx.orderItem.deleteMany({
        where: { id: { in: removedIds }, orderId: order.id },
      });
    }

    for (const input of inputs) {
      if (!input.id) {
        const item = await this.buildNewItem(tx, input);
        await tx.orderItem.create({
          data: { orderId: order.id, ...item.data },
        });
        continue;
      }
      const current = currentById.get(input.id)!;
      if (input.productVariantId !== current.productVariantId) {
        throw new BadRequestException(
          'An existing order item variant cannot be changed',
        );
      }
      const item = await this.buildExistingItem(tx, current, input);
      await tx.orderItemAddon.deleteMany({
        where: { orderItemId: current.id },
      });
      await tx.orderItem.update({
        where: { id: current.id },
        data: {
          quantity: input.quantity,
          baseSubtotal: item.baseSubtotal,
          addonTotal: item.addonTotal,
          lineTotal: item.lineTotal,
          addons: { create: item.addons },
        },
      });
    }
  }

  private async buildNewItem(
    tx: Prisma.TransactionClient,
    input: Omit<ItemInput, 'id'>,
  ) {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.productVariantId },
      select: {
        id: true,
        name: true,
        price: true,
        isActive: true,
        product: {
          select: {
            id: true,
            name: true,
            isActive: true,
            category: { select: { isActive: true } },
          },
        },
      },
    });
    if (!variant) throw new NotFoundException('Product variant not found');
    if (
      !variant.isActive ||
      !variant.product.isActive ||
      !variant.product.category.isActive
    ) {
      throw new ConflictException('Product variant is unavailable');
    }
    const addons = await this.loadNewAddons(
      tx,
      variant.product.id,
      input.addons,
      input.quantity,
    );
    const baseSubtotal = this.round(variant.price.mul(input.quantity));
    const addonTotal = this.sum(addons.map((addon) => addon.totalAmount));
    const lineTotal = baseSubtotal.plus(addonTotal);
    return {
      lineTotal,
      data: {
        productVariantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        unitPrice: variant.price,
        quantity: input.quantity,
        baseSubtotal,
        addonTotal,
        lineTotal,
        addons: { create: addons },
      },
    };
  }

  private async buildExistingItem(
    tx: Prisma.TransactionClient,
    current: CurrentItem,
    input: ItemInput,
  ) {
    const existing = new Map(
      current.addons.map((addon) => [addon.addonId, addon]),
    );
    const requestedIds = input.addons.map((addon) => addon.addonId);
    const assignments = await this.loadAddonAssignments(
      tx,
      current.productVariant.productId,
      requestedIds,
    );
    const addons = input.addons.map((inputAddon) => {
      const previous = existing.get(inputAddon.addonId);
      const assignment = assignments.get(inputAddon.addonId);
      if (!previous && !assignment) {
        throw new ConflictException('Add-on is unavailable for this product');
      }
      if (
        previous &&
        inputAddon.quantity > previous.quantity &&
        (!assignment || inputAddon.quantity > assignment.maxQuantity)
      ) {
        throw new ConflictException('Add-on quantity cannot be increased');
      }
      if (
        !previous &&
        assignment &&
        inputAddon.quantity > assignment.maxQuantity
      ) {
        throw new BadRequestException(
          'Add-on quantity exceeds its product limit',
        );
      }
      const unitPrice = previous?.unitPrice ?? assignment!.addon.unitPrice;
      return {
        addonId: inputAddon.addonId,
        addonName: previous?.addonName ?? assignment!.addon.name,
        unitPrice,
        quantity: inputAddon.quantity,
        totalAmount: this.round(
          unitPrice.mul(inputAddon.quantity).mul(input.quantity),
        ),
      };
    });
    const baseSubtotal = this.round(current.unitPrice.mul(input.quantity));
    const addonTotal = this.sum(addons.map((addon) => addon.totalAmount));
    return {
      baseSubtotal,
      addonTotal,
      lineTotal: baseSubtotal.plus(addonTotal),
      addons,
    };
  }

  private async loadNewAddons(
    tx: Prisma.TransactionClient,
    productId: number,
    inputs: ItemInput['addons'],
    itemQuantity: number,
  ) {
    const assignments = await this.loadAddonAssignments(
      tx,
      productId,
      inputs.map((addon) => addon.addonId),
    );
    return inputs.map((input) => {
      const assignment = assignments.get(input.addonId);
      if (!assignment)
        throw new ConflictException('Add-on is unavailable for this product');
      if (input.quantity > assignment.maxQuantity) {
        throw new BadRequestException(
          'Add-on quantity exceeds its product limit',
        );
      }
      return {
        addonId: input.addonId,
        addonName: assignment.addon.name,
        unitPrice: assignment.addon.unitPrice,
        quantity: input.quantity,
        totalAmount: this.round(
          assignment.addon.unitPrice.mul(input.quantity).mul(itemQuantity),
        ),
      };
    });
  }

  private async loadAddonAssignments(
    tx: Prisma.TransactionClient,
    productId: number,
    addonIds: number[],
  ) {
    if (addonIds.length === 0) return new Map<number, never>();
    const rows = await tx.productAddon.findMany({
      where: {
        productId,
        addonId: { in: addonIds },
        addon: { isActive: true },
      },
      select: {
        addonId: true,
        maxQuantity: true,
        addon: { select: { name: true, unitPrice: true } },
      },
    });
    return new Map(rows.map((row) => [row.addonId, row]));
  }

  private calculateOrder(
    lines: Prisma.Decimal[],
    discount: DiscountInput | null,
    taxPercentInput: string,
  ) {
    const subtotal = this.sum(lines);
    const discountValue = new Prisma.Decimal(discount?.value ?? 0);
    let discountAmount = new Prisma.Decimal(0);
    if (discount?.type === DiscountType.FIXED_AMOUNT) {
      if (discountValue.gt(subtotal)) {
        throw new BadRequestException(
          'Fixed discount cannot exceed the subtotal',
        );
      }
      discountAmount = discountValue;
    } else if (discount?.type === DiscountType.PERCENT) {
      discountAmount = this.round(subtotal.mul(discountValue).div(100));
    }
    const taxPercent = new Prisma.Decimal(taxPercentInput);
    const taxAmount = this.round(
      subtotal.minus(discountAmount).mul(taxPercent).div(100),
    );
    return {
      subtotal,
      discountType: discount?.type ?? null,
      discountValue,
      discountAmount,
      taxPercent,
      taxAmount,
      totalAmount: subtotal.minus(discountAmount).plus(taxAmount),
    };
  }

  private round(value: Prisma.Decimal) {
    return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  private sum(values: Prisma.Decimal[]) {
    return values.reduce(
      (total, value) => total.plus(value),
      new Prisma.Decimal(0),
    );
  }

  private async requireOperator(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!orderOperators.has(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage orders',
      );
    }
    return actor;
  }

  private async requireOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: orderDetailSelect,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async resolveCreateAssignment(
    tx: Prisma.TransactionClient,
    dto: CreateOrderDto,
  ) {
    if (dto.orderType === OrderType.TAKEAWAY) {
      return { orderType: OrderType.TAKEAWAY, tableId: null, tableName: null };
    }
    if (!dto.tableId) {
      throw new BadRequestException('A table is required for dine-in orders');
    }
    const table = await this.requireAvailableTable(tx, dto.tableId);
    return {
      orderType: OrderType.DINE_IN,
      tableId: table.id,
      tableName: table.name,
    };
  }

  private async resolveUpdateAssignment(
    tx: Prisma.TransactionClient,
    current: OrderDetailRecord,
    dto: UpdateOrderDto,
  ) {
    const targetType = dto.orderType ?? current.orderType;
    if (targetType === OrderType.TAKEAWAY) {
      if (dto.orderType === undefined && dto.tableId === null) {
        throw new BadRequestException(
          'Set orderType to TAKEAWAY when removing a table',
        );
      }
      if (dto.tableId != null) {
        throw new BadRequestException('Takeaway orders cannot have a table');
      }
      return { orderType: OrderType.TAKEAWAY, tableId: null, tableName: null };
    }

    const tableId = dto.tableId === undefined ? current.tableId : dto.tableId;
    if (!tableId) {
      throw new BadRequestException('A table is required for dine-in orders');
    }
    if (
      current.orderType === OrderType.DINE_IN &&
      current.tableId === tableId
    ) {
      return {
        orderType: OrderType.DINE_IN,
        tableId,
        tableName: current.tableName,
      };
    }
    const table = await this.requireAvailableTable(tx, tableId, current.id);
    return {
      orderType: OrderType.DINE_IN,
      tableId: table.id,
      tableName: table.name,
    };
  }

  private async requireAvailableTable(
    tx: Prisma.TransactionClient,
    tableId: number,
    excludeOrderId?: number,
  ) {
    const table = await tx.diningTable.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        name: true,
        isActive: true,
        orders: {
          where: {
            status: OrderStatus.OPEN,
            ...(excludeOrderId && { id: { not: excludeOrderId } }),
          },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!table) throw new NotFoundException('Restaurant table not found');
    if (!table.isActive) throw new ConflictException('Restaurant table is inactive');
    if (table.orders.length) {
      throw new ConflictException('Restaurant table already has an open order');
    }
    return table;
  }

  private async runSerializable<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(callback, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Restaurant table already has an open order',
          );
        }
        if (
          !(error instanceof PrismaClientKnownRequestError) ||
          error.code !== 'P2034'
        ) {
          throw error;
        }
        if (attempt === 2) {
          throw new ConflictException('Order changed concurrently');
        }
      }
    }
    throw new ConflictException('Order changed concurrently');
  }
}

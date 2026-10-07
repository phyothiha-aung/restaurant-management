import { Injectable } from '@nestjs/common';
import type { FinancialReport } from '@restaurant-management/shared';
import { BusinessTimeService } from '../../app-config/business-time.service.js';
import { RestaurantSettingsService } from '../../app-config/restaurant-settings.service.js';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { Prisma } from '../../generated/prisma/client.js';
import {
  ExpenseCategory,
  ExpenseStatus,
  OrderStatus,
  OrderType,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UserService } from '../../user/providers/user.service.js';
import { FinancialReportQueryDto } from '../dtos/financial-report-query.dto.js';

type OrderSummaryRow = {
  completedOrderCount: number;
  grossSales: string;
  discounts: string;
  netSales: string;
  collectedTax: string;
  collectedTotal: string;
};
type ExpenseSummaryRow = { expenses: string };
type DailyOrderRow = {
  date: string;
  grossSales: string;
  discounts: string;
  netSales: string;
  collectedTax: string;
  collectedTotal: string;
  completedOrderCount: number;
};
type DailyExpenseRow = { date: string; expenses: string };
type ExpenseCategoryRow = { category: ExpenseCategory; amount: string };
type OrderTypeRow = {
  orderType: OrderType;
  completedOrderCount: number;
  grossSales: string;
  netSales: string;
};
type TopProductRow = {
  productId: number;
  name: string;
  quantity: number;
  grossSales: string;
};

const decimal = (value: string | number) => new Prisma.Decimal(value);
const money = (value: Prisma.Decimal) => value.toDecimalPlaces(2).toFixed(2);

@Injectable()
export class FinancialReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly businessTime: BusinessTimeService,
    private readonly restaurantSettings: RestaurantSettingsService,
  ) {}

  async getFinancialReport(
    query: FinancialReportQueryDto,
    activeUser: ActiveUserDto,
  ): Promise<FinancialReport> {
    await this.users.requireUser(activeUser.sub);
    const timeZone = await this.restaurantSettings.getTimeZone();
    const today = this.businessTime.currentBusinessDate(timeZone);
    const dateFrom = query.dateFrom ?? this.businessTime.firstDateOfMonth(today);
    const dateTo = query.dateTo ?? today;
    const start = this.businessTime.startOfBusinessDate(dateFrom, timeZone);
    const end = this.businessTime.endExclusiveOfBusinessDate(dateTo, timeZone);

    const [orderRows, expenseRows, dailyOrders, dailyExpenses, expenseCategories, orderTypes, topProducts] =
      await this.prisma.$transaction(
        [
          this.prisma.$queryRaw<OrderSummaryRow[]>(Prisma.sql`
            SELECT COUNT(*)::int AS "completedOrderCount",
              COALESCE(SUM("subtotal"), 0)::text AS "grossSales",
              COALESCE(SUM("discountAmount"), 0)::text AS "discounts",
              COALESCE(SUM("subtotal" - "discountAmount"), 0)::text AS "netSales",
              COALESCE(SUM("taxAmount"), 0)::text AS "collectedTax",
              COALESCE(SUM("totalAmount"), 0)::text AS "collectedTotal"
            FROM "orders"
            WHERE "status" = ${OrderStatus.COMPLETED}::"OrderStatus"
              AND "completedAt" >= ${start} AND "completedAt" < ${end}
          `),
          this.prisma.$queryRaw<ExpenseSummaryRow[]>(Prisma.sql`
            SELECT COALESCE(SUM("amount"), 0)::text AS "expenses"
            FROM "expenses"
            WHERE "status" = ${ExpenseStatus.ACTIVE}::"ExpenseStatus"
              AND "expenseDate" >= ${dateFrom}::date AND "expenseDate" <= ${dateTo}::date
          `),
          this.prisma.$queryRaw<DailyOrderRow[]>(Prisma.sql`
            SELECT to_char("completedAt" AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS "date",
              COALESCE(SUM("subtotal"), 0)::text AS "grossSales",
              COALESCE(SUM("discountAmount"), 0)::text AS "discounts",
              COALESCE(SUM("subtotal" - "discountAmount"), 0)::text AS "netSales",
              COALESCE(SUM("taxAmount"), 0)::text AS "collectedTax",
              COALESCE(SUM("totalAmount"), 0)::text AS "collectedTotal",
              COUNT(*)::int AS "completedOrderCount"
            FROM "orders"
            WHERE "status" = ${OrderStatus.COMPLETED}::"OrderStatus"
              AND "completedAt" >= ${start} AND "completedAt" < ${end}
            GROUP BY 1 ORDER BY 1
          `),
          this.prisma.$queryRaw<DailyExpenseRow[]>(Prisma.sql`
            SELECT to_char("expenseDate", 'YYYY-MM-DD') AS "date",
              COALESCE(SUM("amount"), 0)::text AS "expenses"
            FROM "expenses"
            WHERE "status" = ${ExpenseStatus.ACTIVE}::"ExpenseStatus"
              AND "expenseDate" >= ${dateFrom}::date AND "expenseDate" <= ${dateTo}::date
            GROUP BY 1 ORDER BY 1
          `),
          this.prisma.$queryRaw<ExpenseCategoryRow[]>(Prisma.sql`
            SELECT "category", SUM("amount")::text AS "amount"
            FROM "expenses"
            WHERE "status" = ${ExpenseStatus.ACTIVE}::"ExpenseStatus"
              AND "expenseDate" >= ${dateFrom}::date AND "expenseDate" <= ${dateTo}::date
            GROUP BY "category" ORDER BY SUM("amount") DESC, "category"
          `),
          this.prisma.$queryRaw<OrderTypeRow[]>(Prisma.sql`
            SELECT "orderType", COUNT(*)::int AS "completedOrderCount",
              SUM("subtotal")::text AS "grossSales",
              SUM("subtotal" - "discountAmount")::text AS "netSales"
            FROM "orders"
            WHERE "status" = ${OrderStatus.COMPLETED}::"OrderStatus"
              AND "completedAt" >= ${start} AND "completedAt" < ${end}
            GROUP BY "orderType" ORDER BY "orderType"
          `),
          this.prisma.$queryRaw<TopProductRow[]>(Prisma.sql`
            SELECT p."id" AS "productId", p."name", SUM(oi."quantity")::int AS "quantity",
              SUM(oi."lineTotal")::text AS "grossSales"
            FROM "order_items" oi
            JOIN "orders" o ON o."id" = oi."orderId"
            JOIN "product_variants" pv ON pv."id" = oi."productVariantId"
            JOIN "products" p ON p."id" = pv."productId"
            WHERE o."status" = ${OrderStatus.COMPLETED}::"OrderStatus"
              AND o."completedAt" >= ${start} AND o."completedAt" < ${end}
            GROUP BY p."id", p."name"
            ORDER BY SUM(oi."quantity") DESC, SUM(oi."lineTotal") DESC, p."name"
            LIMIT 10
          `),
        ],
        { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
      );

    const orders = orderRows[0];
    const grossSales = decimal(orders?.grossSales ?? 0);
    const discounts = decimal(orders?.discounts ?? 0);
    const netSales = decimal(orders?.netSales ?? 0);
    const collectedTax = decimal(orders?.collectedTax ?? 0);
    const collectedTotal = decimal(orders?.collectedTotal ?? 0);
    const expenses = decimal(expenseRows[0]?.expenses ?? 0);
    const profit = netSales.minus(expenses);
    const completedOrderCount = orders?.completedOrderCount ?? 0;

    const orderDays = new Map(dailyOrders.map((row) => [row.date, row]));
    const expenseDays = new Map(dailyExpenses.map((row) => [row.date, row]));
    const orderTypeRows = new Map(
      orderTypes.map((row) => [row.orderType, row]),
    );
    const daily = this.businessTime.businessDates(dateFrom, dateTo).map((date) => {
      const order = orderDays.get(date);
      const dailyNetSales = decimal(order?.netSales ?? 0);
      const dailyExpense = decimal(expenseDays.get(date)?.expenses ?? 0);
      return {
        date,
        grossSales: money(decimal(order?.grossSales ?? 0)),
        discounts: money(decimal(order?.discounts ?? 0)),
        netSales: money(dailyNetSales),
        collectedTax: money(decimal(order?.collectedTax ?? 0)),
        collectedTotal: money(decimal(order?.collectedTotal ?? 0)),
        expenses: money(dailyExpense),
        profit: money(dailyNetSales.minus(dailyExpense)),
        completedOrderCount: order?.completedOrderCount ?? 0,
      };
    });

    return {
      period: { dateFrom, dateTo, timeZone },
      summary: {
        grossSales: money(grossSales),
        discounts: money(discounts),
        netSales: money(netSales),
        collectedTax: money(collectedTax),
        collectedTotal: money(collectedTotal),
        expenses: money(expenses),
        profit: money(profit),
        profitMargin: netSales.isZero()
          ? null
          : profit.dividedBy(netSales).times(100).toDecimalPlaces(2).toFixed(2),
        averageOrderValue: completedOrderCount === 0
          ? '0.00'
          : money(netSales.dividedBy(completedOrderCount)),
        completedOrderCount,
      },
      daily,
      expensesByCategory: expenseCategories.map((row) => ({
        category: row.category,
        amount: money(decimal(row.amount)),
      })),
      salesByOrderType: [OrderType.DINE_IN, OrderType.TAKEAWAY].map(
        (orderType) => {
          const row = orderTypeRows.get(orderType);
          return {
            orderType,
            completedOrderCount: row?.completedOrderCount ?? 0,
            grossSales: money(decimal(row?.grossSales ?? 0)),
            netSales: money(decimal(row?.netSales ?? 0)),
          };
        },
      ),
      topProducts: topProducts.map((row) => ({
        ...row,
        grossSales: money(decimal(row.grossSales)),
      })),
    };
  }
}

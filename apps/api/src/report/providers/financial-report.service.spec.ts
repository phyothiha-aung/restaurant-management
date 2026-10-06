import { describe, expect, it, vi } from 'vitest';
import { FinancialReportService } from './financial-report.service.js';

const createService = (transactionResult: unknown[]) => {
  const prisma: any = {
    $queryRaw: vi.fn().mockReturnValue({}),
    $transaction: vi.fn().mockResolvedValue(transactionResult),
  };
  const users: any = { requireUser: vi.fn().mockResolvedValue({ id: 1 }) };
  const businessTime: any = {
    timeZone: 'Asia/Yangon',
    currentBusinessDate: vi.fn().mockReturnValue('2026-10-06'),
    firstDateOfMonth: vi.fn().mockReturnValue('2026-10-01'),
    startOfBusinessDate: vi.fn().mockReturnValue(new Date('2026-09-30T17:30:00Z')),
    endExclusiveOfBusinessDate: vi.fn().mockReturnValue(new Date('2026-10-03T17:30:00Z')),
    businessDates: vi.fn().mockReturnValue([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]),
  };
  return {
    service: new FinancialReportService(prisma, users, businessTime),
    prisma,
    users,
    businessTime,
  };
};

describe('FinancialReportService', () => {
  it('reconciles totals and zero-fills missing daily values', async () => {
    const { service, prisma } = createService([
      [{ completedOrderCount: 2, grossSales: '1000', discounts: '100', netSales: '900', collectedTax: '45', collectedTotal: '945' }],
      [{ expenses: '1200' }],
      [{ date: '2026-10-01', grossSales: '1000', discounts: '100', netSales: '900', collectedTax: '45', collectedTotal: '945', completedOrderCount: 2 }],
      [{ date: '2026-10-02', expenses: '1200' }],
      [{ category: 'RENT', amount: '1200' }],
      [{ orderType: 'TAKEAWAY', completedOrderCount: 2, grossSales: '1000', netSales: '900' }],
      [{ productId: 4, name: 'Tea', quantity: 3, grossSales: '1000' }],
    ]);

    const result = await service.getFinancialReport(
      { dateFrom: '2026-10-01', dateTo: '2026-10-03' },
      { sub: 1 } as any,
    );

    expect(result.summary).toMatchObject({
      netSales: '900.00',
      collectedTax: '45.00',
      collectedTotal: '945.00',
      expenses: '1200.00',
      profit: '-300.00',
      profitMargin: '-33.33',
      averageOrderValue: '450.00',
      completedOrderCount: 2,
    });
    expect(result.daily).toEqual([
      expect.objectContaining({ date: '2026-10-01', netSales: '900.00', expenses: '0.00', profit: '900.00' }),
      expect.objectContaining({ date: '2026-10-02', netSales: '0.00', expenses: '1200.00', profit: '-1200.00' }),
      expect.objectContaining({ date: '2026-10-03', netSales: '0.00', expenses: '0.00', profit: '0.00' }),
    ]);
    expect(result.topProducts[0]).toEqual({
      productId: 4,
      name: 'Tea',
      quantity: 3,
      grossSales: '1000.00',
    });
    expect(result.salesByOrderType).toEqual([
      {
        orderType: 'DINE_IN',
        completedOrderCount: 0,
        grossSales: '0.00',
        netSales: '0.00',
      },
      {
        orderType: 'TAKEAWAY',
        completedOrderCount: 2,
        grossSales: '1000.00',
        netSales: '900.00',
      },
    ]);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ isolationLevel: 'RepeatableRead' }),
    );
  });

  it('defaults to the restaurant-local current month and handles no sales', async () => {
    const { service, businessTime } = createService([
      [{ completedOrderCount: 0, grossSales: '0', discounts: '0', netSales: '0', collectedTax: '0', collectedTotal: '0' }],
      [{ expenses: '0' }],
      [], [], [], [], [],
    ]);

    const result = await service.getFinancialReport({}, { sub: 1 } as any);

    expect(result.period).toEqual({
      dateFrom: '2026-10-01',
      dateTo: '2026-10-06',
      timeZone: 'Asia/Yangon',
    });
    expect(result.summary.profitMargin).toBeNull();
    expect(result.summary.averageOrderValue).toBe('0.00');
    expect(businessTime.firstDateOfMonth).toHaveBeenCalledWith('2026-10-06');
  });
});

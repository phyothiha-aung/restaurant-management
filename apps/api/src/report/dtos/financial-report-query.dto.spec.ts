import { describe, expect, it } from 'vitest';
import { FinancialReportQuerySchema } from './financial-report-query.dto.js';

describe('FinancialReportQuerySchema', () => {
  it('allows omitted dates so the service can default the current month', () => {
    expect(FinancialReportQuerySchema.safeParse({}).success).toBe(true);
  });

  it('requires date boundaries as a pair', () => {
    expect(
      FinancialReportQuerySchema.safeParse({ dateFrom: '2026-10-01' }).success,
    ).toBe(false);
    expect(
      FinancialReportQuerySchema.safeParse({ dateTo: '2026-10-31' }).success,
    ).toBe(false);
  });

  it('validates calendar dates and their order', () => {
    expect(
      FinancialReportQuerySchema.safeParse({
        dateFrom: '2026-02-30',
        dateTo: '2026-03-01',
      }).success,
    ).toBe(false);
    expect(
      FinancialReportQuerySchema.safeParse({
        dateFrom: '2026-10-02',
        dateTo: '2026-10-01',
      }).success,
    ).toBe(false);
  });

  it('allows at most 366 inclusive days, including a leap year', () => {
    expect(
      FinancialReportQuerySchema.safeParse({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      }).success,
    ).toBe(true);
    expect(
      FinancialReportQuerySchema.safeParse({
        dateFrom: '2024-01-01',
        dateTo: '2025-01-01',
      }).success,
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { ExpenseStatus } from '../../generated/prisma/enums.js';
import { CreateExpenseSchema } from './create-expense.dto.js';
import { UpdateExpenseSchema } from './update-expense.dto.js';
import { ExpenseQuerySchema } from './expense-query.dto.js';
import { VoidExpenseSchema } from './void-expense.dto.js';

const validExpense = {
  title: 'Cooking oil',
  category: 'INGREDIENTS' as const,
  amount: '125000.50',
  expenseDate: '2026-09-22',
  branchId: 1,
};

describe('expense DTO schemas', () => {
  it('accepts a valid expense and trims text', () => {
    const result = CreateExpenseSchema.parse({
      ...validExpense,
      title: '  Cooking oil  ',
      description: '  Weekly stock  ',
    });

    expect(result.title).toBe('Cooking oil');
    expect(result.description).toBe('Weekly stock');
  });

  it.each(['0', '-1', '1.001', '1000000000000', '01.00'])(
    'rejects invalid amount %s',
    (amount) => {
      expect(
        CreateExpenseSchema.safeParse({ ...validExpense, amount }).success,
      ).toBe(false);
    },
  );

  it.each(['2026-02-30', '22-09-2026', '2026-13-01'])(
    'rejects invalid expense date %s',
    (expenseDate) => {
      expect(
        CreateExpenseSchema.safeParse({ ...validExpense, expenseDate })
          .success,
      ).toBe(false);
    },
  );

  it('rejects empty updates', () => {
    expect(UpdateExpenseSchema.safeParse({}).success).toBe(false);
    expect(UpdateExpenseSchema.safeParse({ amount: '5000' }).success).toBe(
      true,
    );
  });

  it('defaults list status and validates date order', () => {
    expect(ExpenseQuerySchema.parse({}).status).toBe(ExpenseStatus.ACTIVE);
    expect(
      ExpenseQuerySchema.safeParse({
        dateFrom: '2026-09-23',
        dateTo: '2026-09-22',
      }).success,
    ).toBe(false);
  });

  it('requires a meaningful void reason', () => {
    expect(VoidExpenseSchema.safeParse({ reason: 'no' }).success).toBe(false);
    expect(VoidExpenseSchema.parse({ reason: '  Duplicate entry  ' }).reason)
      .toBe('Duplicate entry');
  });
});

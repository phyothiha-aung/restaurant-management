import { z } from '../../common/lib/zod.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/;

export const ExpenseDateSchema = z
  .string()
  .regex(DATE_PATTERN, 'Date must use YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Date must be a valid calendar date');

export const ExpenseAmountSchema = z
  .string()
  .regex(
    AMOUNT_PATTERN,
    'Amount must be a positive decimal with at most 12 whole digits and 2 decimal places',
  )
  .refine((value) => Number(value) > 0, 'Amount must be greater than zero');

export const toExpenseDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`);

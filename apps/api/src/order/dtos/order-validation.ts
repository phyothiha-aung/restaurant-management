import { z } from '../../common/lib/zod.js';

export const OrderMoneySchema = z
  .string()
  .trim()
  .regex(
    /^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/,
    'Must be a non-negative decimal with at most 12 whole digits and 2 decimal places',
  );

export const OrderPercentSchema = OrderMoneySchema.refine(
  (value) => Number(value) <= 100,
  'Must be between 0 and 100',
);

export const OrderDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, 'Must be a valid calendar date');

export const toOrderDateStart = (value: string) =>
  new Date(`${value}T00:00:00.000Z`);

export const toOrderDateEndExclusive = (value: string) => {
  const date = toOrderDateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
};

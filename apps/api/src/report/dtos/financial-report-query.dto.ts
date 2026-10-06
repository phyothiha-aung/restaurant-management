import { differenceInCalendarDays, parseISO } from 'date-fns';
import { createZodDto } from 'nestjs-zod';
import { z } from '../../common/lib/zod.js';
import { OrderDateSchema } from '../../order/dtos/order-validation.js';

export const FinancialReportQuerySchema = z
  .object({
    dateFrom: OrderDateSchema.optional(),
    dateTo: OrderDateSchema.optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.dateFrom) !== Boolean(value.dateTo)) {
      context.addIssue({
        code: 'custom',
        path: [value.dateFrom ? 'dateTo' : 'dateFrom'],
        message: 'dateFrom and dateTo must be provided together',
      });
      return;
    }
    if (!value.dateFrom || !value.dateTo) return;
    if (value.dateFrom > value.dateTo) {
      context.addIssue({
        code: 'custom',
        path: ['dateTo'],
        message: 'dateFrom must be on or before dateTo',
      });
      return;
    }
    if (differenceInCalendarDays(parseISO(value.dateTo), parseISO(value.dateFrom)) > 365) {
      context.addIssue({
        code: 'custom',
        path: ['dateTo'],
        message: 'Report ranges cannot exceed 366 days',
      });
    }
  });

export class FinancialReportQueryDto extends createZodDto(
  FinancialReportQuerySchema,
) {}

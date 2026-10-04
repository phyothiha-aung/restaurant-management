import { createZodDto } from 'nestjs-zod';
import { PaginationQuerySchema } from '../../common/pagination/dtos/pagination-query-dto.js';
import { OrderStatus } from '../../generated/prisma/enums.js';
import { z } from '../../common/lib/zod.js';
import { OrderDateSchema } from './order-validation.js';

export const OrderQuerySchema = PaginationQuerySchema.omit({ search: true })
  .extend({
    status: z.enum(OrderStatus).optional(),
    branchId: z.coerce.number().int().positive().optional(),
    createdById: z.coerce.number().int().positive().optional(),
    dateFrom: OrderDateSchema.optional(),
    dateTo: OrderDateSchema.optional(),
  })
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { path: ['dateTo'], message: 'dateFrom must be on or before dateTo' },
  );

export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}

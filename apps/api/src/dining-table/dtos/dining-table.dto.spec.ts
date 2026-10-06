import { describe, expect, it } from 'vitest';
import { CreateDiningTableSchema } from './create-dining-table.dto.js';
import { DiningTableQuerySchema } from './dining-table-query.dto.js';
import { UpdateDiningTableSchema } from './update-dining-table.dto.js';

describe('dining table DTOs', () => {
  it('trims names and applies lifecycle defaults', () => {
    expect(CreateDiningTableSchema.parse({ name: '  Table 1  ' })).toEqual({
      name: 'Table 1',
      sortOrder: 0,
      isActive: true,
    });
  });

  it('validates capacity and sort order', () => {
    expect(CreateDiningTableSchema.safeParse({ name: 'A', capacity: 0 }).success).toBe(false);
    expect(CreateDiningTableSchema.safeParse({ name: 'A', capacity: 101 }).success).toBe(false);
    expect(CreateDiningTableSchema.safeParse({ name: 'A', sortOrder: -1 }).success).toBe(false);
  });

  it('rejects empty updates and invalid statuses', () => {
    expect(UpdateDiningTableSchema.safeParse({}).success).toBe(false);
    expect(DiningTableQuerySchema.safeParse({ status: 'BUSY' }).success).toBe(false);
    expect(DiningTableQuerySchema.safeParse({ status: 'OCCUPIED' }).success).toBe(true);
  });

  it('strips legacy pagination parameters from list queries', () => {
    expect(
      DiningTableQuerySchema.parse({ page: '2', limit: '50', search: 'Patio' }),
    ).toEqual({ search: 'Patio' });
  });
});

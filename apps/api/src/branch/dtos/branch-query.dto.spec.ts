import { describe, expect, it } from 'vitest';
import { BranchQuerySchema } from './branch-query.dto.js';

describe('BranchQuerySchema', () => {
  it('parses strict boolean filters', () => {
    expect(BranchQuerySchema.parse({ isActive: 'true' }).isActive).toBe(true);
    expect(BranchQuerySchema.parse({ isActive: 'false' }).isActive).toBe(false);
  });

  it('rejects non-boolean strings', () => {
    expect(BranchQuerySchema.safeParse({ isActive: '1' }).success).toBe(false);
    expect(BranchQuerySchema.safeParse({ isActive: 'yes' }).success).toBe(
      false,
    );
  });
});

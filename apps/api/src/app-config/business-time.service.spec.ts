import { describe, expect, it } from 'vitest';
import { BusinessTimeService } from './business-time.service.js';

const service = new BusinessTimeService();

describe('BusinessTimeService', () => {
  it('converts Yangon business dates to UTC boundaries', () => {
    expect(service.startOfBusinessDate('2026-10-06', 'Asia/Yangon').toISOString()).toBe(
      '2026-10-05T17:30:00.000Z',
    );
    expect(service.endExclusiveOfBusinessDate('2026-10-06', 'Asia/Yangon').toISOString()).toBe(
      '2026-10-06T17:30:00.000Z',
    );
  });

  it('adds calendar days safely over daylight-saving transitions', () => {
    expect(service.startOfBusinessDate('2026-03-08', 'America/New_York').toISOString()).toBe(
      '2026-03-08T05:00:00.000Z',
    );
    expect(service.endExclusiveOfBusinessDate('2026-03-08', 'America/New_York').toISOString()).toBe(
      '2026-03-09T04:00:00.000Z',
    );
  });

  it('returns restaurant-local dates and inclusive calendar sequences', () => {
    expect(
      service.currentBusinessDate('Asia/Yangon', new Date('2026-10-05T18:00:00.000Z')),
    ).toBe('2026-10-06');
    expect(service.firstDateOfMonth('2026-10-06')).toBe('2026-10-01');
    expect(service.businessDates('2024-02-28', '2024-03-01')).toEqual([
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
    ]);
  });
});

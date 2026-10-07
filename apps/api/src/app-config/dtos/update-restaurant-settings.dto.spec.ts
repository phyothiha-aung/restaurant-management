import { describe, expect, it } from 'vitest';
import { UpdateRestaurantSettingsSchema } from './update-restaurant-settings.dto.js';

describe('UpdateRestaurantSettingsSchema', () => {
  it('trims values and normalizes blank optional fields', () => {
    expect(
      UpdateRestaurantSettingsSchema.parse({
        name: '  Ann Htike  ',
        address: '   ',
        timeZone: ' Asia/Yangon ',
        receiptPaperWidth: 80,
      }),
    ).toEqual({
      name: 'Ann Htike',
      address: null,
      timeZone: 'Asia/Yangon',
      receiptPaperWidth: 80,
    });
  });

  it('rejects empty updates, invalid timezones, and unsupported widths', () => {
    expect(UpdateRestaurantSettingsSchema.safeParse({}).success).toBe(false);
    expect(
      UpdateRestaurantSettingsSchema.safeParse({ timeZone: 'Yangon' }).success,
    ).toBe(false);
    expect(
      UpdateRestaurantSettingsSchema.safeParse({ receiptPaperWidth: 76 })
        .success,
    ).toBe(false);
  });
});

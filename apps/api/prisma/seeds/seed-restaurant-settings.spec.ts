import { afterEach, describe, expect, it, vi } from 'vitest';
import { seedRestaurantSettings } from './seed-restaurant-settings.js';

const originalName = process.env.RESTAURANT_NAME;
const originalTimeZone = process.env.RESTAURANT_TIME_ZONE;

afterEach(() => {
  process.env.RESTAURANT_NAME = originalName;
  process.env.RESTAURANT_TIME_ZONE = originalTimeZone;
});

describe('seedRestaurantSettings', () => {
  it('creates missing settings without overwriting an existing row', async () => {
    process.env.RESTAURANT_NAME = ' Ann Htike ';
    process.env.RESTAURANT_TIME_ZONE = 'Asia/Yangon';
    const upsert = vi.fn().mockResolvedValue({});
    const app: any = { get: () => ({ restaurantSettings: { upsert } }) };

    await seedRestaurantSettings(app);

    expect(upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Ann Htike',
        timeZone: 'Asia/Yangon',
        receiptPaperWidth: 80,
      },
    });
  });

  it('rejects an unsupported timezone', async () => {
    process.env.RESTAURANT_NAME = 'Ann Htike';
    process.env.RESTAURANT_TIME_ZONE = 'Yangon';
    const app: any = { get: vi.fn() };
    await expect(seedRestaurantSettings(app)).rejects.toThrow('IANA timezone');
  });
});

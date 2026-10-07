import { describe, expect, it } from 'vitest';
import { AppConfigController } from './app-config.controller.js';
import type { RestaurantSettingsService } from './restaurant-settings.service.js';

describe('AppConfigController', () => {
  it('returns the stable public application config contract', async () => {
    const config = {
      restaurantName: 'Ann Htike',
      restaurantAddress: null,
      restaurantPhone: null,
      restaurantTaxId: null,
      timeZone: 'Asia/Yangon',
      receiptFooter: null,
      receiptPaperWidth: 80 as const,
    };
    const settings = {
      getPublicConfig: () => Promise.resolve(config),
    } as RestaurantSettingsService;
    await expect(new AppConfigController(settings).getConfig()).resolves.toEqual(config);
  });
});

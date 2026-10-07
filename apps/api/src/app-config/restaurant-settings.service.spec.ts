import { describe, expect, it, vi } from 'vitest';
import { RestaurantSettingsService } from './restaurant-settings.service.js';

const record = {
  id: 1,
  name: 'Ann Htike',
  address: null,
  phone: null,
  taxId: null,
  timeZone: 'Asia/Yangon',
  receiptFooter: null,
  receiptPaperWidth: 80,
  createdAt: new Date('2026-10-07T00:00:00Z'),
  updatedAt: new Date('2026-10-07T01:00:00Z'),
  updatedBy: null,
  logo: null,
};

describe('RestaurantSettingsService', () => {
  it('returns the public receipt-safe configuration', async () => {
    const prisma: any = {
      restaurantSettings: { findUnique: vi.fn().mockResolvedValue(record) },
    };
    const service = new RestaurantSettingsService(prisma, {} as any);
    await expect(service.getPublicConfig()).resolves.toEqual({
      restaurantName: 'Ann Htike',
      restaurantAddress: null,
      restaurantPhone: null,
      restaurantTaxId: null,
      restaurantLogoUrl: null,
      timeZone: 'Asia/Yangon',
      receiptFooter: null,
      receiptPaperWidth: 80,
    });
  });

  it('records the updating user and maps timestamps', async () => {
    const prisma: any = {
      restaurantSettings: {
        update: vi.fn().mockResolvedValue({
          ...record,
          name: 'New name',
          updatedBy: { id: 7, name: 'Owner' },
        }),
      },
    };
    const service = new RestaurantSettingsService(prisma, {} as any);
    const result = await service.update(
      { name: 'New name' } as any,
      { sub: 7 } as any,
    );
    expect(prisma.restaurantSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: { name: 'New name', updatedById: 7 },
      }),
    );
    expect(result).toMatchObject({
      name: 'New name',
      updatedAt: '2026-10-07T01:00:00.000Z',
      updatedBy: { id: 7, name: 'Owner' },
    });
  });

  it('fails startup with an actionable message when settings are missing', async () => {
    const prisma: any = {
      restaurantSettings: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    await expect(
      new RestaurantSettingsService(prisma, {} as any).onModuleInit(),
    ).rejects.toThrow('npm run seed');
  });
});

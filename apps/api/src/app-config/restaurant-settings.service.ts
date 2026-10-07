import { Injectable, OnModuleInit } from '@nestjs/common';
import type {
  AppConfig,
  ReceiptPaperWidth,
  RestaurantSettings,
} from '@restaurant-management/shared';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import type { UpdateRestaurantSettingsDto } from './dtos/update-restaurant-settings.dto.js';
import type { Prisma } from '../generated/prisma/client.js';

const settingsSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  taxId: true,
  timeZone: true,
  receiptFooter: true,
  receiptPaperWidth: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: { select: { id: true, name: true } },
} as const;

type SettingsRecord = Prisma.RestaurantSettingsGetPayload<{
  select: typeof settingsSelect;
}>;

@Injectable()
export class RestaurantSettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const settings = await this.prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      select: { id: true },
    });
    if (!settings) {
      throw new Error(
        'Restaurant settings are not initialized. Run `npm run seed` before starting the API.',
      );
    }
  }

  async getPublicConfig(): Promise<AppConfig> {
    const settings = await this.requireSettings();
    return {
      restaurantName: settings.name,
      restaurantAddress: settings.address,
      restaurantPhone: settings.phone,
      restaurantTaxId: settings.taxId,
      timeZone: settings.timeZone,
      receiptFooter: settings.receiptFooter,
      receiptPaperWidth: settings.receiptPaperWidth as ReceiptPaperWidth,
    };
  }

  async getSettings(): Promise<RestaurantSettings> {
    return this.toSettings(await this.requireSettings());
  }

  async getTimeZone(): Promise<string> {
    const settings = await this.prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      select: { timeZone: true },
    });
    if (!settings) throw this.missingSettingsError();
    return settings.timeZone;
  }

  async update(
    dto: UpdateRestaurantSettingsDto,
    actor: ActiveUserDto,
  ): Promise<RestaurantSettings> {
    const settings = await this.prisma.restaurantSettings.update({
      where: { id: 1 },
      data: { ...dto, updatedById: actor.sub },
      select: settingsSelect,
    });
    return this.toSettings(settings);
  }

  private async requireSettings() {
    const settings = await this.prisma.restaurantSettings.findUnique({
      where: { id: 1 },
      select: settingsSelect,
    });
    if (!settings) throw this.missingSettingsError();
    return settings;
  }

  private toSettings(settings: SettingsRecord): RestaurantSettings {
    return {
      ...settings,
      receiptPaperWidth: settings.receiptPaperWidth as ReceiptPaperWidth,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  private missingSettingsError() {
    return new Error(
      'Restaurant settings are not initialized. Run `npm run seed` before starting the API.',
    );
  }
}

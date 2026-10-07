import { INestApplicationContext } from '@nestjs/common';
import { isSupportedTimeZone } from '../../src/environment.validation.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

export async function seedRestaurantSettings(app: INestApplicationContext) {
  const prisma = app.get(PrismaService);
  const name = process.env.RESTAURANT_NAME?.trim();
  const timeZone = process.env.RESTAURANT_TIME_ZONE?.trim();

  if (!name || !timeZone) {
    throw new Error(
      'RESTAURANT_NAME and RESTAURANT_TIME_ZONE are required to seed restaurant settings',
    );
  }
  if (!isSupportedTimeZone(timeZone)) {
    throw new Error('RESTAURANT_TIME_ZONE must be a supported IANA timezone');
  }

  await prisma.restaurantSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name, timeZone, receiptPaperWidth: 80 },
  });

  console.log('✅ Restaurant settings initialized');
}

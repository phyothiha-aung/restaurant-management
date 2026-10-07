// prisma/seed.ts
import { NestFactory } from '@nestjs/core';
import { seedSuperadmin } from './seeds/seed-superadmin.js';
import { seedRestaurantSettings } from './seeds/seed-restaurant-settings.js';
import { SeedModule } from './seed.module.js';

async function main() {
  const app = await NestFactory.createApplicationContext(SeedModule);

  try {
    console.log('🌱 Seeding started...');

    await seedRestaurantSettings(app);
    await seedSuperadmin(app);

    console.log('Seeding completed');
  } catch (error) {
    console.error('Seeding failed', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

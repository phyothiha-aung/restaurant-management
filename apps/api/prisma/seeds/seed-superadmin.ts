// prisma/seeds/seed-superadmin.ts
import { INestApplicationContext } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { HashingProvider } from '../../src/common/crypto/provider/hashing.provider.js';

export async function seedSuperadmin(app: INestApplicationContext) {
  const prismaService = app.get(PrismaService);
  const hashingProvider = app.get(HashingProvider);

  const name = process.env.SUPERADMIN_NAME;
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!name || !email || !password) {
    const missing = [
      !name ? 'SUPERADMIN_NAME' : null,
      !email ? 'SUPERADMIN_EMAIL' : null,
      !password ? 'SUPERADMIN_PASSWORD' : null,
    ].filter(Boolean);
    console.log(`Superadmin not created (missing env: ${missing.join(', ')})`);
    return;
  }

  const passwordHash = await hashingProvider.hashPassword(password);

  await prismaService.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      passwordHash,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Superadmin created');
}

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import environmentValidation from './environment.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/access-token.guard.js';
import { AuthenticationGuard } from './auth/guards/authentication.guard.js';
import { ExpenseModule } from './expense/expense.module.js';
import { StorageModule } from './storage/storage.module.js';
import { ProductCategoryModule } from './product-category/product-category.module.js';
import { ProductModule } from './product/product.module.js';
import { OrderModule } from './order/order.module.js';
import { DiningTableModule } from './dining-table/dining-table.module.js';
import { AppConfigModule } from './app-config/app-config.module.js';
import { ReportModule } from './report/report.module.js';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,

      validate: (config) => {
        const result = environmentValidation.safeParse(config);

        if (!result.success) {
          const details = result.error.issues
            .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
            .join('; ');
          throw new Error(`Environment validation failed: ${details}`);
        }

        return result.data;
      },
    }),
    AuthModule,
    UserModule,
    ExpenseModule,
    StorageModule,
    ProductCategoryModule,
    ProductModule,
    OrderModule,
    DiningTableModule,
    AppConfigModule,
    ReportModule,
    CryptoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, guard: AccessTokenGuard) =>
        new AuthenticationGuard(reflector, guard),
      inject: [Reflector, AccessTokenGuard],
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import environmentValidation from './environment.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { BranchModule } from './branch/branch.module.js';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/access-token.guard.js';
import { AuthenticationGuard } from './auth/guards/authentication.guard.js';

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
    BranchModule,
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

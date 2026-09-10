import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import environmentValidation from './environment.validation.js';
import jwtConfig from './auth/config/jwt.config.js';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './auth/guards/authentication.guard.js';
import { AccessTokenGuard } from './auth/guards/access-token.guard.js';
import { JwtProvider } from './auth/providers/jwt.provider.js';
import { RefreshTokenProvider } from './auth/providers/refresh-token.provider.js';

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
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    AuthModule,
    UserModule,
    CryptoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    AccessTokenGuard,
    JwtProvider,
    RefreshTokenProvider,
  ],
})
export class AppModule {}

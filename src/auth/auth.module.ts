import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './providers/auth.service.js';
import { LoginProvider } from './providers/login.provider.js';
import { JwtProvider } from './providers/jwt.provider.js';
import { RefreshTokenProvider } from './providers/refresh-token.provider.js';
import jwtConfig from './config/jwt.config.js';
import { UserModule } from '../user/user.module.js';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LoginProvider, JwtProvider, RefreshTokenProvider],
  imports: [
    UserModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  exports: [AuthService],
})
export class AuthModule {}

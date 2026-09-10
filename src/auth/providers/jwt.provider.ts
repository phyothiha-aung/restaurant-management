import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config.js';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenProvider } from './refresh-token.provider.js';
import { ActiveUserDto } from '../dtos/active-user.dto.js';
import { User, UserRole } from '../../generated/prisma/client.js';
import { TokenType } from '../constants/auth.constant.js';

@Injectable()
export class JwtProvider {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

    private readonly jwtService: JwtService,

    private readonly refreshTokenProvider: RefreshTokenProvider,
  ) {}

  private async signToken<T>(
    userId: number,
    expiresIn: number,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }

  public async verifyToken<T extends Partial<ActiveUserDto>>(token: string) {
    return await this.jwtService.verifyAsync<T>(token, {
      secret: this.jwtConfiguration.secret,
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
    });
  }

  public async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshTokenTtl: number;
  }> {
    const refreshTokenJti = crypto.randomUUID();

    const adminRoles: UserRole[] = [UserRole.SUPERADMIN, UserRole.ADMIN];

    const ttl = adminRoles.includes(user.role)
      ? this.jwtConfiguration.refreshTokenTtlAdmin
      : this.jwtConfiguration.refreshTokenTtl;

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserDto>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          role: user.role,
          tokenType: TokenType.ACCESS_TOKEN,
        },
      ),

      this.signToken(user.id, ttl, {
        jti: refreshTokenJti,
        tokenType: TokenType.REFRESH_TOKEN,
      }),
    ]);

    const expiredAt = new Date();
    expiredAt.setSeconds(expiredAt.getSeconds() + ttl);

    await this.refreshTokenProvider.create(
      refreshToken,
      user.id,
      refreshTokenJti,
      expiredAt,
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenTtl: ttl,
    };
  }

  public async refreshTokens(refreshToken: string) {
    try {
      const { sub, tokenType, jti } =
        await this.verifyToken<
          Pick<ActiveUserDto, 'sub' | 'tokenType' | 'jti'>
        >(refreshToken);

      if (!sub) throw new UnauthorizedException('Invalid refresh token');
      if (!jti) throw new UnauthorizedException('Refresh token not found');

      if (tokenType !== TokenType.REFRESH_TOKEN)
        throw new UnauthorizedException('Invalid token type');

      const token = await this.refreshTokenProvider.findOne(
        refreshToken,
        sub,
        jti,
      );

      if (!token) throw new UnauthorizedException('Refresh token not found');

      if (!token.user) throw new UnauthorizedException('Invalid refresh token');

      await this.refreshTokenProvider.deleteByJti(token.jti);

      return this.generateTokens(token.user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  public async revokeRefreshToken(refreshToken: string) {
    try {
      const { tokenType, jti } =
        await this.verifyToken<Pick<ActiveUserDto, 'tokenType' | 'jti'>>(
          refreshToken,
        );

      if (tokenType !== TokenType.REFRESH_TOKEN || !jti) {
        return;
      }

      await this.refreshTokenProvider.deleteByJti(jti);
    } catch {
      return;
    }
  }
}

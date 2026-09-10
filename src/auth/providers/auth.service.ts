import { Injectable } from '@nestjs/common';
import { LoginProvider } from './login.provider.js';
import { JwtProvider } from './jwt.provider.js';
import { LoginDto } from '../dtos/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginProvider: LoginProvider,

    private readonly jwtProvider: JwtProvider,
  ) {}

  public async login(loginDto: LoginDto) {
    return this.loginProvider.login(loginDto);
  }

  public async refreshTokens(refreshToken: string) {
    return this.jwtProvider.refreshTokens(refreshToken);
  }

  public async logout(refreshToken: string) {
    return this.jwtProvider.revokeRefreshToken(refreshToken);
  }
}

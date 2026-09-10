import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { UserService } from '../../user/providers/user.service.js';
import { HashingProvider } from '../../common/crypto/provider/hashing.provider.js';
import { JwtProvider } from './jwt.provider.js';
import { LoginDto } from '../dtos/login.dto.js';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class LoginProvider {
  constructor(
    private readonly usersService: UserService,

    private readonly hashingProvider: HashingProvider,

    private readonly jwtProvider: JwtProvider,
  ) {}

  public async login(loginDto: LoginDto) {
    const user = await this.checkCredentials(loginDto);

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }

    const updatedUser = await this.usersService.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate JWT token
    const { accessToken, refreshToken, refreshTokenTtl } =
      await this.jwtProvider.generateTokens(updatedUser);

    return {
      user: this.usersService.sanitizedUser(updatedUser),
      accessToken,
      refreshToken,
      refreshTokenTtl,
    };
  }

  private async checkCredentials(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new ForbiddenException('Invalid credentials');
    }

    let isPasswordMatch: boolean = false;

    try {
      isPasswordMatch = await this.hashingProvider.comparePassword(
        loginDto.password,
        user.passwordHash,
      );
    } catch (_error) {
      throw new RequestTimeoutException('Could not verify password');
    }

    if (!isPasswordMatch) {
      throw new ForbiddenException('Invalid credentials');
    }

    return user;
  }
}

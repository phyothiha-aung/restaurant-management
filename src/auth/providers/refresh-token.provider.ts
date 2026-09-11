import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HashingProvider } from '../../common/crypto/provider/hashing.provider.js';
import { UserStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class RefreshTokenProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async findOne(token: string, userId: number, jti: string) {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { jti },
      include: { user: { include: { branch: true } } },
    });

    if (!refreshToken) return null;

    if (refreshToken.userId !== userId) {
      return null;
    }

    const isMatch = await this.hashingProvider.comparePassword(
      token,
      refreshToken.tokenHash,
    );

    if (!isMatch) {
      return null;
    }

    if (refreshToken.expiredAt <= new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: refreshToken.id },
      });
      return null;
    }

    if (refreshToken.user?.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.delete({
        where: { id: refreshToken.id },
      });
      return null;
    }

    if (refreshToken.user.branchId && !refreshToken.user.branch?.isActive) {
      await this.prisma.refreshToken.delete({ where: { id: refreshToken.id } });
      return null;
    }

    return refreshToken;
  }

  public async create(
    token: string,
    userId: number,
    jti: string,
    expiredAt: Date,
  ) {
    try {
      const hashedToken = await this.hashingProvider.hashPassword(token);

      return await this.prisma.refreshToken.create({
        data: { tokenHash: hashedToken, userId, jti, expiredAt },
      });
    } catch {
      throw new InternalServerErrorException('Error creating refresh token');
    }
  }

  public async deleteByJti(jti: string) {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: { jti },
      });
    } catch {
      throw new InternalServerErrorException('Error deleting refresh token');
    }
  }
}

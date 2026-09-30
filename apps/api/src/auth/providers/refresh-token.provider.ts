import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HashingProvider } from '../../common/crypto/provider/hashing.provider.js';
import { UserStatus } from '../../generated/prisma/enums.js';
import type { Prisma, User } from '../../generated/prisma/client.js';

export interface RefreshTokenDraft {
  accessToken: string;
  refreshToken: string;
  refreshTokenTtl: number;
  jti: string;
  expiredAt: Date;
}

export type AuthUser = User & {
  branch: Prisma.BranchGetPayload<object> | null;
};

@Injectable()
export class RefreshTokenProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async rotate(
    token: string,
    userId: number,
    jti: string,
    createReplacement: (user: AuthUser) => Promise<RefreshTokenDraft>,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const storedToken = await transaction.refreshToken.findUnique({
        where: { jti },
        include: { user: { include: { branch: true } } },
      });

      if (!storedToken || storedToken.userId !== userId || !storedToken.user) {
        return null;
      }

      const isMatch = await this.hashingProvider.comparePassword(
        token,
        storedToken.tokenHash,
      );
      if (!isMatch) return null;

      const user = storedToken.user;
      const isExpired = storedToken.expiredAt <= new Date();
      const isInactiveUser = user.status !== UserStatus.ACTIVE;
      const isInactiveBranch = user.branchId !== null && !user.branch?.isActive;

      if (isExpired || isInactiveUser || isInactiveBranch) {
        await transaction.refreshToken.deleteMany({
          where: { id: storedToken.id, jti, userId },
        });
        return null;
      }

      const consumed = await transaction.refreshToken.deleteMany({
        where: { id: storedToken.id, jti, userId },
      });
      if (consumed.count !== 1) return null;

      const replacement = await createReplacement(user);
      const tokenHash = await this.hashingProvider.hashPassword(
        replacement.refreshToken,
      );

      await transaction.refreshToken.create({
        data: {
          userId,
          jti: replacement.jti,
          tokenHash,
          expiredAt: replacement.expiredAt,
        },
      });

      return {
        accessToken: replacement.accessToken,
        refreshToken: replacement.refreshToken,
        refreshTokenTtl: replacement.refreshTokenTtl,
      };
    });
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

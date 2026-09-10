import {
  ConflictException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HashingProvider } from '../../common/crypto/provider/hashing.provider.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { UpdateUserDto } from '../dtos/update-user-dto.js';
import { UserRole } from '../../generated/prisma/enums.js';
import { User } from '../../generated/prisma/client.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async findAll() {
    try {
      return await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      });
    } catch (_error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment please try later',
      );
    }
  }

  public async findOneByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (_error) {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment please try later',
      );
    }
  }

  public async findOneById(id: number) {
    try {
      return await this.prisma.user.findUnique({ where: { id } });
    } catch (_error) {
      throw new RequestTimeoutException('Error finding user in the database');
    }
  }

  public async findSanitizedUserById(id: number) {
    const user = await this.findOneById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizedUser(user);
  }

  public async create(createUserDto: CreateUserDto) {
    const { password, pin, ...data } = createUserDto;

    let passwordHash: string | null = null;
    let pinHash: string | null = null;

    if (password) {
      passwordHash = await this.hashingProvider.hashPassword(password);
    }

    if (pin) {
      pinHash = await this.hashingProvider.hashPassword(pin);
    }
    try {
      return await this.prisma.user.create({
        data: {
          ...data,
          passwordHash,
          pinHash,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A user with this email or username already exists',
        );
      }
      throw new RequestTimeoutException('Error creating user in the database');
    }
  }

  public async update(
    id: number,
    updateUserDto: UpdateUserDto & { lastLoginAt?: Date; verifiedAt?: Date },
  ) {
    const { branchId, password, pin, ...data } = updateUserDto;

    const passwordHash = password
      ? await this.hashingProvider.hashPassword(password)
      : undefined;

    const pinHash = pin
      ? await this.hashingProvider.hashPassword(pin)
      : undefined;

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          ...(passwordHash !== undefined && { passwordHash }),
          ...(pinHash !== undefined && { pinHash }),
          branch: branchId ? { connect: { id: branchId } } : undefined,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('A user with this email already exists');
        }
      }
      throw new RequestTimeoutException('Error updating user in the database');
    }
  }

  public async deleteManager(id: number) {
    try {
      await this.prisma.user.delete({ where: { id, role: UserRole.MANAGER } });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
      }
      throw new RequestTimeoutException(
        'Error deleting user from the database',
      );
    }
  }

  public sanitizedUser(user: User) {
    const { passwordHash: _p, pinHash: _pin, ...sanitized } = user;

    return sanitized;
  }
}

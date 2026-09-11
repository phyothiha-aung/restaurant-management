import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HashingProvider } from '../../common/crypto/provider/hashing.provider.js';
import { PaginationProvider } from '../../common/pagination/providers/pagination.provider.js';
import { CreateUserDto } from '../dtos/create-user.dto.js';
import { UpdateUserDto } from '../dtos/update-user.dto.js';
import { UpdateSelfDto } from '../dtos/update-self.dto.js';
import { UserQueryDto } from '../dtos/user-query.dto.js';
import { UserStatus } from '../../generated/prisma/enums.js';
import type { Prisma, User } from '../../generated/prisma/client.js';
import type { Request } from 'express';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { PermissionProvider } from './permission.provider.js';

const publicUserSelect = {
  id: true,
  branchId: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  branch: {
    select: { id: true, branchCode: true, name: true, isActive: true },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashing: HashingProvider,
    private readonly permission: PermissionProvider,
    private readonly pagination: PaginationProvider,
  ) {}

  async findAll(
    query: UserQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    const actor = await this.requireUser(activeUser.sub);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException('You do not have permission to list users');
    }

    const filters: Prisma.UserWhereInput[] = [
      {
        role: { in: this.permission.manageableRoles(actor.role) },
        ...(query.role && { role: query.role }),
        ...(query.status && { status: query.status }),
        ...(query.branchId && { branchId: query.branchId }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
    ];
    if (!this.permission.isGlobalRole(actor.role)) {
      filters.push({ branchId: actor.branchId ?? -1 });
    }
    const where: Prisma.UserWhereInput = { AND: filters };

    return this.pagination.paginateQuery(
      query,
      this.prisma.user,
      {
        where,
        select: publicUserSelect,
        orderBy: { createdAt: 'desc' },
      },
      request,
    );
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    });
  }

  async findOneById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { branch: true },
    });
  }

  async requireUser(id: number) {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findMe(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneManaged(id: number, activeUser: ActiveUserDto) {
    const [actor, target] = await Promise.all([
      this.requireUser(activeUser.sub),
      this.requireUser(id),
    ]);
    this.permission.assertCanManageUser(actor, target);
    return this.findMe(target.id);
  }

  async create(dto: CreateUserDto, activeUser: ActiveUserDto) {
    const actor = await this.requireUser(activeUser.sub);
    this.permission.assertCanAssignRole(actor, dto.role, dto.branchId ?? null);
    await this.validateRoleAndBranch(dto.role, dto.branchId ?? null);

    const passwordHash = await this.hashing.hashPassword(dto.password);
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
          status: dto.status,
          branchId: dto.branchId ?? null,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateUserDto, activeUser: ActiveUserDto) {
    const [actor, target] = await Promise.all([
      this.requireUser(activeUser.sub),
      this.requireUser(id),
    ]);
    this.permission.assertCanManageUser(actor, target);

    const role = dto.role ?? target.role;
    const branchId = this.permission.isGlobalRole(role)
      ? null
      : dto.branchId === undefined
        ? target.branchId
        : dto.branchId;
    this.permission.assertCanAssignRole(actor, role, branchId);
    await this.validateRoleAndBranch(role, branchId);

    const passwordHash = dto.password
      ? await this.hashing.hashPassword(dto.password)
      : undefined;
    const { password: _password, branchId: _branchId, ...data } = dto;

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
          where: { id },
          data: {
            ...data,
            branchId,
            ...(passwordHash && { passwordHash }),
          },
          select: publicUserSelect,
        });
        if (passwordHash || dto.status === UserStatus.INACTIVE) {
          await transaction.refreshToken.deleteMany({ where: { userId: id } });
        }
        return updated;
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateSelf(id: number, dto: UpdateSelfDto) {
    await this.requireUser(id);
    const passwordHash = dto.password
      ? await this.hashing.hashPassword(dto.password)
      : undefined;
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
          where: { id },
          data: {
            ...(dto.name && { name: dto.name }),
            ...(passwordHash && { passwordHash }),
          },
          select: publicUserSelect,
        });
        if (passwordHash) {
          await transaction.refreshToken.deleteMany({ where: { userId: id } });
        }
        return updated;
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivate(id: number, activeUser: ActiveUserDto) {
    const [actor, target] = await Promise.all([
      this.requireUser(activeUser.sub),
      this.requireUser(id),
    ]);
    this.permission.assertCanManageUser(actor, target);
    if (target.status === UserStatus.INACTIVE) return this.findMe(target.id);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.update({
        where: { id },
        data: { status: UserStatus.INACTIVE },
        select: publicUserSelect,
      });
      await transaction.refreshToken.deleteMany({ where: { userId: id } });
      return updated;
    });
  }

  async updateLastLogin(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
      include: { branch: true },
    });
  }

  sanitizedUser<T extends User>(user: T) {
    const {
      passwordHash: _passwordHash,
      pinHash: _pinHash,
      ...sanitized
    } = user;
    return sanitized;
  }

  private async validateRoleAndBranch(
    role: User['role'],
    branchId: number | null,
  ) {
    if (this.permission.isGlobalRole(role)) {
      if (branchId !== null) {
        throw new ForbiddenException(
          'Restaurant-wide roles cannot have a branch',
        );
      }
      return;
    }
    if (!branchId) throw new ForbiddenException('This role requires a branch');
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.isActive) throw new ForbiddenException('Branch is inactive');
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }
      if (error.code === 'P2025') throw new NotFoundException('User not found');
    }
    throw error;
  }
}

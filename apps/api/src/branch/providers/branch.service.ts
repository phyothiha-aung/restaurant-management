import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginationProvider } from '../../common/pagination/providers/pagination.provider.js';
import { PermissionProvider } from '../../user/providers/permission.provider.js';
import { UserService } from '../../user/providers/user.service.js';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { CreateBranchDto } from '../dtos/create-branch.dto.js';
import { UpdateBranchDto } from '../dtos/update-branch.dto.js';
import { BranchQueryDto } from '../dtos/branch-query.dto.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { Request } from 'express';

const branchWithUserCountSelect = {
  id: true,
  branchCode: true,
  name: true,
  address: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { users: true } },
} satisfies Prisma.BranchSelect;

type BranchWithUserCount = Prisma.BranchGetPayload<{
  select: typeof branchWithUserCountSelect;
}>;

const toBranchResponse = ({ _count, ...branch }: BranchWithUserCount) => ({
  ...branch,
  userCount: _count.users,
});

@Injectable()
export class BranchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async findAll(
    query: BranchQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    const actor = await this.users.requireUser(activeUser.sub);
    const where: Prisma.BranchWhereInput = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(!this.permission.isGlobalRole(actor.role) && {
        id: actor.branchId ?? -1,
      }),
      ...(query.search && {
        OR: ['name', 'branchCode', 'address', 'phone'].map((field) => ({
          [field]: { contains: query.search, mode: 'insensitive' },
        })),
      }),
    };

    const result = await this.pagination.paginateRawQuery<BranchWithUserCount>(
      query,
      (skip, take) =>
        this.prisma.branch.findMany({
          where,
          select: branchWithUserCountSelect,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
      () => this.prisma.branch.count({ where }),
      request,
    );

    return {
      ...result,
      data: result.data.map(toBranchResponse),
    };
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    const actor = await this.users.requireUser(activeUser.sub);
    if (!this.permission.isGlobalRole(actor.role) && actor.branchId !== id) {
      throw new NotFoundException('Branch not found');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: branchWithUserCountSelect,
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return toBranchResponse(branch);
  }

  async create(dto: CreateBranchDto, activeUser: ActiveUserDto) {
    await this.requireBranchManager(activeUser.sub);
    try {
      const branch = await this.prisma.branch.create({
        data: dto,
        select: branchWithUserCountSelect,
      });
      return toBranchResponse(branch);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateBranchDto, activeUser: ActiveUserDto) {
    await this.requireBranchManager(activeUser.sub);
    await this.requireBranch(id);
    try {
      const branch = await this.prisma.branch.update({
        where: { id },
        data: dto,
        select: branchWithUserCountSelect,
      });
      return toBranchResponse(branch);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivate(id: number, activeUser: ActiveUserDto) {
    await this.requireBranchManager(activeUser.sub);
    const branch = await this.requireBranch(id);
    if (!branch.isActive) return toBranchResponse(branch);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.branch.update({
        where: { id },
        data: { isActive: false },
        select: branchWithUserCountSelect,
      });
      await transaction.refreshToken.deleteMany({
        where: { user: { branchId: id } },
      });
      return toBranchResponse(updated);
    });
  }

  private async requireBranchManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isBranchManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage branches',
      );
    }
    return actor;
  }

  private async requireBranch(id: number) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: branchWithUserCountSelect,
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A branch with this code already exists');
      }
      if (error.code === 'P2025')
        throw new NotFoundException('Branch not found');
    }
    throw error;
  }
}

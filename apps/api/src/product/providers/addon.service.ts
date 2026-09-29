import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { Request } from 'express';
import { ActiveUserDto } from '../../auth/dtos/active-user.dto.js';
import { PaginationProvider } from '../../common/pagination/providers/pagination.provider.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PermissionProvider } from '../../user/providers/permission.provider.js';
import { UserService } from '../../user/providers/user.service.js';
import { AddonQueryDto } from '../dtos/addon-query.dto.js';
import { CreateAddonDto, UpdateAddonDto } from '../dtos/addon.dto.js';

const addonSelect = {
  id: true,
  name: true,
  unitPrice: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { productAssignments: true } },
} satisfies Prisma.AddonSelect;

type AddonRecord = Prisma.AddonGetPayload<{ select: typeof addonSelect }>;

@Injectable()
export class AddonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async findAll(
    query: AddonQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    await this.requireReader(activeUser.sub);
    const where: Prisma.AddonWhereInput = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };
    return this.pagination.paginateRawQuery(
      query,
      async (skip, take) => {
        const addons = await this.prisma.addon.findMany({
          where,
          select: addonSelect,
          orderBy: { name: 'asc' },
          skip,
          take,
        });
        return addons.map((addon) => this.toPublicAddon(addon));
      },
      () => this.prisma.addon.count({ where }),
      request,
    );
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    await this.requireReader(activeUser.sub);
    return this.toPublicAddon(await this.requireAddon(id));
  }

  async create(dto: CreateAddonDto, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    await this.assertUniqueName(dto.name);
    try {
      const addon = await this.prisma.addon.create({
        data: dto,
        select: addonSelect,
      });
      return this.toPublicAddon(addon);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateAddonDto, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    await this.requireAddon(id);
    if (dto.name !== undefined) await this.assertUniqueName(dto.name, id);
    try {
      const addon = await this.prisma.addon.update({
        where: { id },
        data: dto,
        select: addonSelect,
      });
      return this.toPublicAddon(addon);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivate(id: number, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    const addon = await this.requireAddon(id);
    if (!addon.isActive) return this.toPublicAddon(addon);
    const updated = await this.prisma.addon.update({
      where: { id },
      data: { isActive: false },
      select: addonSelect,
    });
    return this.toPublicAddon(updated);
  }

  private async requireAddon(id: number) {
    const addon = await this.prisma.addon.findUnique({
      where: { id },
      select: addonSelect,
    });
    if (!addon) throw new NotFoundException('Add-on not found');
    return addon;
  }

  private async assertUniqueName(name: string, excludeId?: number) {
    const addon = await this.prisma.addon.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (addon) {
      throw new ConflictException('An add-on with this name already exists');
    }
  }

  private async requireReader(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to view add-ons',
      );
    }
    return actor;
  }

  private async requireManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isBranchManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage add-ons',
      );
    }
    return actor;
  }

  private toPublicAddon(addon: AddonRecord) {
    const { _count, ...base } = addon;
    return {
      ...base,
      unitPrice: addon.unitPrice.toString(),
      productCount: _count.productAssignments,
    };
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('An add-on with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Add-on not found');
      }
    }
    throw error;
  }
}

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
import { CreateProductCategoryDto } from '../dtos/create-product-category.dto.js';
import { ProductCategoryQueryDto } from '../dtos/product-category-query.dto.js';
import { UpdateProductCategoryDto } from '../dtos/update-product-category.dto.js';

const publicCategorySelect = {
  id: true,
  name: true,
  description: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductCategorySelect;

type PublicCategory = Prisma.ProductCategoryGetPayload<{
  select: typeof publicCategorySelect;
}>;

@Injectable()
export class ProductCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async findAll(
    query: ProductCategoryQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    await this.requireCategoryReader(activeUser.sub);
    const where: Prisma.ProductCategoryWhereInput = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.pagination.paginateRawQuery<PublicCategory>(
      query,
      (skip, take) =>
        this.prisma.productCategory.findMany({
          where,
          select: publicCategorySelect,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip,
          take,
        }),
      () => this.prisma.productCategory.count({ where }),
      request,
    );
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    await this.requireCategoryReader(activeUser.sub);
    return this.requireCategory(id);
  }

  async create(dto: CreateProductCategoryDto, activeUser: ActiveUserDto) {
    await this.requireCategoryManager(activeUser.sub);
    await this.assertUniqueName(dto.name);
    try {
      return await this.prisma.productCategory.create({
        data: {
          ...dto,
          description: dto.description || null,
        },
        select: publicCategorySelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(
    id: number,
    dto: UpdateProductCategoryDto,
    activeUser: ActiveUserDto,
  ) {
    await this.requireCategoryManager(activeUser.sub);
    await this.requireCategory(id);
    if (dto.name) await this.assertUniqueName(dto.name, id);
    try {
      return await this.prisma.productCategory.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.description !== undefined && {
            description: dto.description || null,
          }),
        },
        select: publicCategorySelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivate(id: number, activeUser: ActiveUserDto) {
    await this.requireCategoryManager(activeUser.sub);
    const category = await this.requireCategory(id);
    if (!category.isActive) return category;
    return this.prisma.productCategory.update({
      where: { id },
      data: { isActive: false },
      select: publicCategorySelect,
    });
  }

  private async requireCategoryReader(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to view product categories',
      );
    }
    return actor;
  }

  private async requireCategoryManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isBranchManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage product categories',
      );
    }
    return actor;
  }

  private async requireCategory(id: number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      select: publicCategorySelect,
    });
    if (!category) throw new NotFoundException('Product category not found');
    return category;
  }

  private async assertUniqueName(name: string, excludeId?: number) {
    const category = await this.prisma.productCategory.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (category) {
      throw new ConflictException('A product category with this name already exists');
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A product category with this name already exists',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Product category not found');
      }
    }
    throw error;
  }
}

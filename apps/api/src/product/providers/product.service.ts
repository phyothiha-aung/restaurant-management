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
import { CreateProductDto } from '../dtos/create-product.dto.js';
import { CreateProductAddonDto } from '../dtos/create-product-addon.dto.js';
import { CreateProductVariantDto } from '../dtos/create-product-variant.dto.js';
import { ProductQueryDto } from '../dtos/product-query.dto.js';
import {
  OptionOverrideDto,
  ProductOverrideDto,
} from '../dtos/product-override.dto.js';
import { UpdateProductAddonDto } from '../dtos/update-product-addon.dto.js';
import { UpdateProductDto } from '../dtos/update-product.dto.js';
import { UpdateProductVariantDto } from '../dtos/update-product-variant.dto.js';

const productSelect = {
  id: true,
  categoryId: true,
  code: true,
  name: true,
  description: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
  variants: {
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      price: true,
      sortOrder: true,
      isActive: true,
    },
  },
  addons: {
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      unitPrice: true,
      maxQuantity: true,
      sortOrder: true,
      isActive: true,
    },
  },
  image: {
    select: {
      id: true,
      fileId: true,
      createdAt: true,
      file: {
        select: {
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

type PublicProduct = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
  ) {}

  async findAll(
    query: ProductQueryDto,
    activeUser: ActiveUserDto,
    request: Request,
  ) {
    await this.requireReader(activeUser.sub);
    const where: Prisma.ProductWhereInput = {
      ...(query.categoryId !== undefined && { categoryId: query.categoryId }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.pagination.paginateRawQuery<PublicProduct>(
      query,
      (skip, take) =>
        this.prisma.product.findMany({
          where,
          select: productSelect,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip,
          take,
        }),
      () => this.prisma.product.count({ where }),
      request,
    );
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    await this.requireReader(activeUser.sub);
    return this.requireProduct(id);
  }

  async create(dto: CreateProductDto, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    await this.requireCategory(dto.categoryId);
    await this.assertUniqueName(dto.name, dto.categoryId);
    await this.assertUniqueCode(dto.code);

    try {
      return await this.prisma.product.create({
        data: {
          ...dto,
          code: dto.code || null,
          description: dto.description || null,
        },
        select: productSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateProductDto, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    const product = await this.requireProduct(id);
    const categoryId = dto.categoryId ?? product.categoryId;

    if (dto.categoryId !== undefined)
      await this.requireCategory(dto.categoryId);
    if (dto.name !== undefined)
      await this.assertUniqueName(dto.name, categoryId, id);
    if (dto.code !== undefined) await this.assertUniqueCode(dto.code, id);

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.code !== undefined && { code: dto.code || null }),
          ...(dto.description !== undefined && {
            description: dto.description || null,
          }),
        },
        select: productSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivate(id: number, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    const product = await this.requireProduct(id);
    if (!product.isActive) return product;

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: productSelect,
    });
  }

  async createVariant(
    productId: number,
    dto: CreateProductVariantDto,
    activeUser: ActiveUserDto,
  ) {
    await this.requireManager(activeUser.sub);
    await this.requireProduct(productId);
    await this.assertUniqueVariantName(productId, dto.name);
    try {
      return await this.prisma.productVariant.create({
        data: { ...dto, productId },
        select: this.variantSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateVariant(
    productId: number,
    variantId: number,
    dto: UpdateProductVariantDto,
    activeUser: ActiveUserDto,
  ) {
    await this.requireManager(activeUser.sub);
    await this.requireVariant(productId, variantId);
    if (dto.name !== undefined) {
      await this.assertUniqueVariantName(productId, dto.name, variantId);
    }
    try {
      return await this.prisma.productVariant.update({
        where: { id: variantId },
        data: dto,
        select: this.variantSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivateVariant(
    productId: number,
    variantId: number,
    activeUser: ActiveUserDto,
  ) {
    await this.requireManager(activeUser.sub);
    const variant = await this.requireVariant(productId, variantId);
    if (!variant.isActive) return variant;
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
      select: this.variantSelect,
    });
  }

  async createAddon(
    productId: number,
    dto: CreateProductAddonDto,
    activeUser: ActiveUserDto,
  ) {
    await this.requireManager(activeUser.sub);
    await this.requireProduct(productId);
    await this.assertUniqueAddonName(productId, dto.name);
    try {
      return await this.prisma.productAddon.create({
        data: { ...dto, productId },
        select: this.addonSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async updateAddon(
    productId: number,
    addonId: number,
    dto: UpdateProductAddonDto,
    activeUser: ActiveUserDto,
  ) {
    await this.requireManager(activeUser.sub);
    await this.requireAddon(productId, addonId);
    if (dto.name !== undefined) {
      await this.assertUniqueAddonName(productId, dto.name, addonId);
    }
    try {
      return await this.prisma.productAddon.update({
        where: { id: addonId },
        data: dto,
        select: this.addonSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivateAddon(
    productId: number,
    addonId: number,
    activeUser: ActiveUserDto,
  ) {
    await this.requireManager(activeUser.sub);
    const addon = await this.requireAddon(productId, addonId);
    if (!addon.isActive) return addon;
    return this.prisma.productAddon.update({
      where: { id: addonId },
      data: { isActive: false },
      select: this.addonSelect,
    });
  }

  async menu(branchId: number, activeUser: ActiveUserDto) {
    const actor = await this.requireReader(activeUser.sub);
    await this.requireBranchAccess(actor, branchId);
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        categoryId: true,
        code: true,
        name: true,
        description: true,
        sortOrder: true,
        category: { select: { id: true, name: true } },
        branchOverrides: {
          where: { branchId },
          select: { isAvailable: true },
        },
        variants: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            price: true,
            sortOrder: true,
            branchOverrides: {
              where: { branchId },
              select: { priceOverride: true, isAvailable: true },
            },
          },
        },
        addons: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            unitPrice: true,
            maxQuantity: true,
            sortOrder: true,
            branchOverrides: {
              where: { branchId },
              select: { priceOverride: true, isAvailable: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return products
      .filter((product) => product.branchOverrides[0]?.isAvailable !== false)
      .map(({ variants, addons, ...product }) => ({
        ...product,
        variants: variants
          .filter(
            (variant) => variant.branchOverrides[0]?.isAvailable !== false,
          )
          .map(({ branchOverrides: overrides, ...variant }) => ({
            ...variant,
            price: String(overrides[0]?.priceOverride ?? variant.price),
          })),
        addons: addons
          .filter((addon) => addon.branchOverrides[0]?.isAvailable !== false)
          .map(({ branchOverrides: overrides, ...addon }) => ({
            ...addon,
            unitPrice: String(overrides[0]?.priceOverride ?? addon.unitPrice),
          })),
      }));
  }

  async upsertProductOverride(
    productId: number,
    branchId: number,
    dto: ProductOverrideDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManagerOrBranchManager(activeUser.sub);
    await this.requireBranchAccess(actor, branchId);
    await this.requireProduct(productId);
    return this.prisma.branchProductOverride.upsert({
      where: { branchId_productId: { branchId, productId } },
      create: { branchId, productId, isAvailable: dto.isAvailable },
      update: { isAvailable: dto.isAvailable },
    });
  }

  async deleteProductOverride(
    productId: number,
    branchId: number,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManagerOrBranchManager(activeUser.sub);
    await this.requireBranchAccess(actor, branchId);
    await this.requireProduct(productId);
    return this.prisma.branchProductOverride.deleteMany({
      where: { branchId, productId },
    });
  }

  async upsertVariantOverride(
    productId: number,
    variantId: number,
    branchId: number,
    dto: OptionOverrideDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManagerOrBranchManager(activeUser.sub);
    await this.requireBranchAccess(actor, branchId);
    await this.requireVariant(productId, variantId);
    return this.prisma.branchProductVariantOverride.upsert({
      where: { branchId_variantId: { branchId, variantId } },
      create: { branchId, variantId, ...dto },
      update: dto,
    });
  }

  async deleteVariantOverride(
    productId: number,
    variantId: number,
    branchId: number,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManagerOrBranchManager(activeUser.sub);
    await this.requireBranchAccess(actor, branchId);
    await this.requireVariant(productId, variantId);
    return this.prisma.branchProductVariantOverride.deleteMany({
      where: { branchId, variantId },
    });
  }

  async upsertAddonOverride(
    productId: number,
    addonId: number,
    branchId: number,
    dto: OptionOverrideDto,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManagerOrBranchManager(activeUser.sub);
    await this.requireBranchAccess(actor, branchId);
    await this.requireAddon(productId, addonId);
    return this.prisma.branchProductAddonOverride.upsert({
      where: { branchId_addonId: { branchId, addonId } },
      create: { branchId, addonId, ...dto },
      update: dto,
    });
  }

  async deleteAddonOverride(
    productId: number,
    addonId: number,
    branchId: number,
    activeUser: ActiveUserDto,
  ) {
    const actor = await this.requireManagerOrBranchManager(activeUser.sub);
    await this.requireBranchAccess(actor, branchId);
    await this.requireAddon(productId, addonId);
    return this.prisma.branchProductAddonOverride.deleteMany({
      where: { branchId, addonId },
    });
  }

  private readonly variantSelect = {
    id: true,
    productId: true,
    name: true,
    price: true,
    sortOrder: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.ProductVariantSelect;

  private readonly addonSelect = {
    id: true,
    productId: true,
    name: true,
    unitPrice: true,
    maxQuantity: true,
    sortOrder: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.ProductAddonSelect;

  private async requireReader(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to view products',
      );
    }
    return actor;
  }

  private async requireManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isBranchManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage products',
      );
    }
    return actor;
  }

  private async requireManagerOrBranchManager(userId: number) {
    const actor = await this.users.requireUser(userId);
    if (!this.permission.isUserManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage product overrides',
      );
    }
    return actor;
  }

  private async requireBranchAccess(
    actor: Awaited<ReturnType<UserService['requireUser']>>,
    branchId: number,
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, isActive: true },
    });
    if (!branch || !branch.isActive)
      throw new NotFoundException('Branch not found');
    this.permission.validateOwnership(actor, branchId);
  }

  private async requireProduct(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async requireVariant(productId: number, id: number) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id, productId },
      select: this.variantSelect,
    });
    if (!variant) throw new NotFoundException('Product variant not found');
    return variant;
  }

  private async requireAddon(productId: number, id: number) {
    const addon = await this.prisma.productAddon.findFirst({
      where: { id, productId },
      select: this.addonSelect,
    });
    if (!addon) throw new NotFoundException('Product add-on not found');
    return addon;
  }

  private async requireCategory(id: number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Product category not found');
  }

  private async assertUniqueName(
    name: string,
    categoryId: number,
    excludeId?: number,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        categoryId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (product) {
      throw new ConflictException(
        'A product with this name already exists in the category',
      );
    }
  }

  private async assertUniqueCode(
    code: string | null | undefined,
    excludeId?: number,
  ) {
    if (!code) return;
    const product = await this.prisma.product.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (product)
      throw new ConflictException('A product with this code already exists');
  }

  private async assertUniqueVariantName(
    productId: number,
    name: string,
    excludeId?: number,
  ) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        productId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (variant)
      throw new ConflictException('A variant with this name already exists');
  }

  private async assertUniqueAddonName(
    productId: number,
    name: string,
    excludeId?: number,
  ) {
    const addon = await this.prisma.productAddon.findFirst({
      where: {
        productId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    if (addon)
      throw new ConflictException('An add-on with this name already exists');
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A product with these values already exists',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
    }
    throw error;
  }
}

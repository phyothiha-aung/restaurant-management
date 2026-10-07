import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
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
import { StorageService } from '../../storage/storage.service.js';
import type {
  CreateProductDto,
  ProductAddonAssignmentSchema,
  ProductVariantInputSchema,
} from '../dtos/create-product.dto.js';
import { ProductQueryDto } from '../dtos/product-query.dto.js';
import { UpdateProductDto } from '../dtos/update-product.dto.js';
import type { z } from '../../common/lib/zod.js';

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
    select: { id: true, name: true, isActive: true },
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
  addonAssignments: {
    orderBy: [{ sortOrder: 'asc' }, { addon: { name: 'asc' } }],
    select: {
      maxQuantity: true,
      sortOrder: true,
      addon: {
        select: {
          id: true,
          name: true,
          unitPrice: true,
          isActive: true,
        },
      },
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

const menuSelect = {
  id: true,
  categoryId: true,
  code: true,
  name: true,
  description: true,
  sortOrder: true,
  category: { select: { id: true, name: true } },
  variants: {
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      price: true,
      sortOrder: true,
    },
  },
  addonAssignments: {
    where: { addon: { isActive: true } },
    orderBy: [{ sortOrder: 'asc' }, { addon: { name: 'asc' } }],
    select: {
      maxQuantity: true,
      sortOrder: true,
      addon: {
        select: { id: true, name: true, unitPrice: true },
      },
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
          objectKey: true,
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;
type MenuProductRecord = Prisma.ProductGetPayload<{
  select: typeof menuSelect;
}>;
type VariantInput = z.infer<typeof ProductVariantInputSchema>;
type AddonAssignmentInput = z.infer<typeof ProductAddonAssignmentSchema>;

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationProvider,
    private readonly permission: PermissionProvider,
    private readonly users: UserService,
    private readonly storage: StorageService,
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

    return this.pagination.paginateRawQuery(
      query,
      async (skip, take) => {
        const products = await this.prisma.product.findMany({
          where,
          select: productSelect,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          skip,
          take,
        });
        return products.map((product) => this.toPublicProduct(product));
      },
      () => this.prisma.product.count({ where }),
      request,
    );
  }

  async findOne(id: number, activeUser: ActiveUserDto) {
    await this.requireReader(activeUser.sub);
    return this.toPublicProduct(await this.requireProduct(id));
  }

  async create(dto: CreateProductDto, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    this.validateVariantPayload(dto.variants);
    this.validateAddonPayload(dto.addons);
    if (dto.isActive && !dto.variants.some((variant) => variant.isActive)) {
      throw new ConflictException(
        'An active product requires at least one active variant',
      );
    }
    await this.requireCategory(dto.categoryId, dto.isActive);
    await this.requireActiveAddons(dto.addons);
    await this.assertUniqueName(dto.name, dto.categoryId);
    await this.assertUniqueCode(dto.code);

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            categoryId: dto.categoryId,
            code: dto.code || null,
            name: dto.name,
            description: dto.description || null,
            sortOrder: dto.sortOrder,
            isActive: dto.isActive,
          },
          select: { id: true },
        });
        await tx.productVariant.createMany({
          data: dto.variants.map((variant) => ({
            productId: created.id,
            ...variant,
          })),
        });
        if (dto.addons.length > 0) {
          await tx.productAddon.createMany({
            data: dto.addons.map((assignment) => ({
              productId: created.id,
              ...assignment,
            })),
          });
        }
        return tx.product.findUniqueOrThrow({
          where: { id: created.id },
          select: productSelect,
        });
      });
      return this.toPublicProduct(product);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: number, dto: UpdateProductDto, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    const existing = await this.requireProduct(id);
    const categoryId = dto.categoryId ?? existing.categoryId;
    const isActive = dto.isActive ?? existing.isActive;

    if (dto.variants !== undefined) {
      this.validateVariantPayload(dto.variants);
      await this.validateOwnedVariantIds(id, dto.variants);
    }
    if (dto.addons !== undefined) {
      this.validateAddonPayload(dto.addons);
      await this.requireActiveAddons(dto.addons);
    }

    const activeVariantCount =
      dto.variants === undefined
        ? existing.variants.filter((variant) => variant.isActive).length
        : dto.variants.filter((variant) => variant.isActive).length;
    if (isActive && activeVariantCount === 0) {
      throw new ConflictException(
        'An active product requires at least one active variant',
      );
    }

    await this.requireCategory(categoryId, isActive);
    if (dto.name !== undefined || dto.categoryId !== undefined) {
      await this.assertUniqueName(dto.name ?? existing.name, categoryId, id);
    }
    if (dto.code !== undefined) await this.assertUniqueCode(dto.code, id);

    const { variants, addons, ...productFields } = dto;
    try {
      const product = await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            ...productFields,
            ...(dto.code !== undefined && { code: dto.code || null }),
            ...(dto.description !== undefined && {
              description: dto.description || null,
            }),
          },
          select: { id: true },
        });

        if (variants !== undefined) {
          const retainedIds = variants.flatMap((variant) =>
            variant.id === undefined ? [] : [variant.id],
          );
          await tx.productVariant.updateMany({
            where: {
              productId: id,
              ...(retainedIds.length > 0 && { id: { notIn: retainedIds } }),
            },
            data: { isActive: false },
          });
          for (const variant of variants) {
            const { id: variantId, ...data } = variant;
            if (variantId === undefined) {
              await tx.productVariant.create({
                data: { productId: id, ...data },
              });
            } else {
              await tx.productVariant.update({
                where: { id: variantId },
                data,
              });
            }
          }
        }

        if (addons !== undefined) {
          await tx.productAddon.deleteMany({ where: { productId: id } });
          if (addons.length > 0) {
            await tx.productAddon.createMany({
              data: addons.map((assignment) => ({
                productId: id,
                ...assignment,
              })),
            });
          }
        }

        return tx.product.findUniqueOrThrow({
          where: { id },
          select: productSelect,
        });
      });
      return this.toPublicProduct(product);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async deactivate(id: number, activeUser: ActiveUserDto) {
    await this.requireManager(activeUser.sub);
    const product = await this.requireProduct(id);
    if (!product.isActive) return this.toPublicProduct(product);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: productSelect,
    });
    return this.toPublicProduct(updated);
  }

  async menu(activeUser: ActiveUserDto) {
    await this.users.requireUser(activeUser.sub);
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: { isActive: true },
        variants: { some: { isActive: true } },
      },
      select: menuSelect,
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });
    return Promise.all(products.map((product) => this.toMenuProduct(product)));
  }

  private validateVariantPayload(variants: VariantInput[]) {
    const ids = variants.flatMap((variant) =>
      variant.id === undefined ? [] : [variant.id],
    );
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Variant IDs must be unique');
    }
    const names = variants.map((variant) => variant.name.toLocaleLowerCase());
    if (new Set(names).size !== names.length) {
      throw new BadRequestException('Variant names must be unique');
    }
  }

  private validateAddonPayload(addons: AddonAssignmentInput[]) {
    const ids = addons.map((assignment) => assignment.addonId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Add-on IDs must be unique');
    }
  }

  private async validateOwnedVariantIds(
    productId: number,
    variants: VariantInput[],
  ) {
    const ids = variants.flatMap((variant) =>
      variant.id === undefined ? [] : [variant.id],
    );
    if (ids.length === 0) return;
    const count = await this.prisma.productVariant.count({
      where: { productId, id: { in: ids } },
    });
    if (count !== ids.length) {
      throw new BadRequestException(
        'One or more variants do not belong to this product',
      );
    }
  }

  private async requireActiveAddons(addons: AddonAssignmentInput[]) {
    if (addons.length === 0) return;
    const ids = addons.map((assignment) => assignment.addonId);
    const count = await this.prisma.addon.count({
      where: { id: { in: ids }, isActive: true },
    });
    if (count !== ids.length) {
      throw new BadRequestException(
        'Every assigned add-on must exist and be active',
      );
    }
  }

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
    if (!this.permission.isManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage products',
      );
    }
    return actor;
  }

  private async requireProduct(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async requireCategory(id: number, mustBeActive: boolean) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!category) throw new NotFoundException('Product category not found');
    if (mustBeActive && !category.isActive) {
      throw new ConflictException(
        'An active product requires an active category',
      );
    }
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
    if (product) {
      throw new ConflictException('A product with this code already exists');
    }
  }

  private toPublicProduct(product: ProductRecord) {
    const { addonAssignments, variants, ...base } = product;
    return {
      ...base,
      variants: variants.map((variant) => ({
        ...variant,
        price: variant.price.toString(),
      })),
      addons: addonAssignments.map(({ addon, ...assignment }) => ({
        ...addon,
        unitPrice: addon.unitPrice.toString(),
        ...assignment,
      })),
    };
  }

  private async toMenuProduct(product: MenuProductRecord) {
    const { addonAssignments, variants, image, ...base } = product;
    let imageUrl: string | null = null;
    if (image) {
      try {
        imageUrl = (await this.storage.createAccessUrl(image.file)).url;
      } catch (error) {
        this.logger.warn(
          `Could not create a signed image URL for product ${product.id}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }
    return {
      ...base,
      image: image
        ? {
            ...image,
            file: {
              originalName: image.file.originalName,
              mimeType: image.file.mimeType,
              sizeBytes: image.file.sizeBytes,
              status: image.file.status,
            },
          }
        : null,
      imageUrl,
      variants: variants.map((variant) => ({
        ...variant,
        price: variant.price.toString(),
      })),
      addons: addonAssignments.map(({ addon, ...assignment }) => ({
        ...addon,
        unitPrice: addon.unitPrice.toString(),
        ...assignment,
      })),
    };
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'A product, variant, or assignment with these values already exists',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
    }
    throw error;
  }
}

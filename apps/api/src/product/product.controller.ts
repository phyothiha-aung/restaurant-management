import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { CreateProductDto } from './dtos/create-product.dto.js';
import { AttachProductImageDto } from './dtos/attach-product-image.dto.js';
import { CreateProductAddonDto } from './dtos/create-product-addon.dto.js';
import { CreateProductVariantDto } from './dtos/create-product-variant.dto.js';
import {
  OptionOverrideDto,
  ProductOverrideDto,
} from './dtos/product-override.dto.js';
import { ProductQueryDto } from './dtos/product-query.dto.js';
import { PresignProductImageDto } from './dtos/presign-product-image.dto.js';
import { UpdateProductAddonDto } from './dtos/update-product-addon.dto.js';
import { UpdateProductDto } from './dtos/update-product.dto.js';
import { UpdateProductVariantDto } from './dtos/update-product-variant.dto.js';
import { ProductService } from './providers/product.service.js';
import { ProductImageService } from './providers/product-image.service.js';

const productReaderRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
];

const productManagerRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
];

@Controller('products')
export class ProductController {
  constructor(
    private readonly products: ProductService,
    private readonly images: ProductImageService,
  ) {}

  @Get()
  @Roles(...productReaderRoles)
  findAll(
    @Query() query: ProductQueryDto,
    @ActiveUser() user: ActiveUserDto,
    @Req() request: Request,
  ) {
    return this.products.findAll(query, user, request);
  }

  @Post('images/presign')
  @Roles(...productManagerRoles)
  presignImage(
    @Body() dto: PresignProductImageDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.images.presign(dto, user);
  }

  @Post('images/:fileId/complete')
  @Roles(...productManagerRoles)
  completeImage(
    @Param('fileId') fileId: string,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.images.complete(fileId, user);
  }

  @Get('menu')
  @Roles(...productReaderRoles)
  menu(
    @Query('branchId', ParseIntPipe) branchId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.menu(branchId, user);
  }

  @Post()
  @Roles(...productManagerRoles)
  create(@Body() dto: CreateProductDto, @ActiveUser() user: ActiveUserDto) {
    return this.products.create(dto, user);
  }

  @Get(':id')
  @Roles(...productReaderRoles)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.findOne(id, user);
  }

  @Put(':productId/image')
  @Roles(...productManagerRoles)
  attachImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: AttachProductImageDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.images.attach(productId, dto, user);
  }

  @Delete(':productId/image')
  @Roles(...productManagerRoles)
  removeImage(
    @Param('productId', ParseIntPipe) productId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.images.remove(productId, user);
  }

  @Get(':productId/image/access-url')
  @Roles(...productReaderRoles)
  imageAccessUrl(
    @Param('productId', ParseIntPipe) productId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.images.accessUrl(productId, user);
  }

  @Patch(':id')
  @Roles(...productManagerRoles)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...productManagerRoles)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.deactivate(id, user);
  }

  @Post(':productId/variants')
  @Roles(...productManagerRoles)
  createVariant(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductVariantDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.createVariant(productId, dto, user);
  }

  @Patch(':productId/variants/:variantId')
  @Roles(...productManagerRoles)
  updateVariant(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Body() dto: UpdateProductVariantDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.updateVariant(productId, variantId, dto, user);
  }

  @Delete(':productId/variants/:variantId')
  @Roles(...productManagerRoles)
  deactivateVariant(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.deactivateVariant(productId, variantId, user);
  }

  @Post(':productId/addons')
  @Roles(...productManagerRoles)
  createAddon(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductAddonDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.createAddon(productId, dto, user);
  }

  @Patch(':productId/addons/:addonId')
  @Roles(...productManagerRoles)
  updateAddon(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('addonId', ParseIntPipe) addonId: number,
    @Body() dto: UpdateProductAddonDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.updateAddon(productId, addonId, dto, user);
  }

  @Delete(':productId/addons/:addonId')
  @Roles(...productManagerRoles)
  deactivateAddon(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('addonId', ParseIntPipe) addonId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.deactivateAddon(productId, addonId, user);
  }

  @Put(':productId/overrides/:branchId')
  @Roles(...productManagerRoles, UserRole.BRANCH_MANAGER)
  upsertProductOverride(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() dto: ProductOverrideDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.upsertProductOverride(productId, branchId, dto, user);
  }

  @Delete(':productId/overrides/:branchId')
  @Roles(...productManagerRoles, UserRole.BRANCH_MANAGER)
  deleteProductOverride(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('branchId', ParseIntPipe) branchId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.deleteProductOverride(productId, branchId, user);
  }

  @Put(':productId/variants/:variantId/overrides/:branchId')
  @Roles(...productManagerRoles, UserRole.BRANCH_MANAGER)
  upsertVariantOverride(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() dto: OptionOverrideDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.upsertVariantOverride(
      productId,
      variantId,
      branchId,
      dto,
      user,
    );
  }

  @Delete(':productId/variants/:variantId/overrides/:branchId')
  @Roles(...productManagerRoles, UserRole.BRANCH_MANAGER)
  deleteVariantOverride(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Param('branchId', ParseIntPipe) branchId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.deleteVariantOverride(
      productId,
      variantId,
      branchId,
      user,
    );
  }

  @Put(':productId/addons/:addonId/overrides/:branchId')
  @Roles(...productManagerRoles, UserRole.BRANCH_MANAGER)
  upsertAddonOverride(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('addonId', ParseIntPipe) addonId: number,
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() dto: OptionOverrideDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.upsertAddonOverride(
      productId,
      addonId,
      branchId,
      dto,
      user,
    );
  }

  @Delete(':productId/addons/:addonId/overrides/:branchId')
  @Roles(...productManagerRoles, UserRole.BRANCH_MANAGER)
  deleteAddonOverride(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('addonId', ParseIntPipe) addonId: number,
    @Param('branchId', ParseIntPipe) branchId: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.products.deleteAddonOverride(
      productId,
      addonId,
      branchId,
      user,
    );
  }
}

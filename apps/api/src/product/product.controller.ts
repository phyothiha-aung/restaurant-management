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
import { AttachProductImageDto } from './dtos/attach-product-image.dto.js';
import { CreateProductDto } from './dtos/create-product.dto.js';
import { PresignProductImageDto } from './dtos/presign-product-image.dto.js';
import { ProductQueryDto } from './dtos/product-query.dto.js';
import { UpdateProductDto } from './dtos/update-product.dto.js';
import { ProductImageService } from './providers/product-image.service.js';
import { ProductService } from './providers/product.service.js';

const allStaffRoles = Object.values(UserRole);

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
  @Roles(...allStaffRoles)
  menu(@ActiveUser() user: ActiveUserDto) {
    return this.products.menu(user);
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
  @Roles(...allStaffRoles)
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
}

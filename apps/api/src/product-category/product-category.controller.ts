import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { CreateProductCategoryDto } from './dtos/create-product-category.dto.js';
import { ProductCategoryQueryDto } from './dtos/product-category-query.dto.js';
import { UpdateProductCategoryDto } from './dtos/update-product-category.dto.js';
import { ProductCategoryService } from './providers/product-category.service.js';

const categoryReaderRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
];

const categoryManagerRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
];

@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly categories: ProductCategoryService) {}

  @Get()
  @Roles(...categoryReaderRoles)
  findAll(
    @Query() query: ProductCategoryQueryDto,
    @ActiveUser() user: ActiveUserDto,
    @Req() request: Request,
  ) {
    return this.categories.findAll(query, user, request);
  }

  @Post()
  @Roles(...categoryManagerRoles)
  create(
    @Body() dto: CreateProductCategoryDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.categories.create(dto, user);
  }

  @Get(':id')
  @Roles(...categoryReaderRoles)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.categories.findOne(id, user);
  }

  @Patch(':id')
  @Roles(...categoryManagerRoles)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductCategoryDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.categories.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...categoryManagerRoles)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.categories.deactivate(id, user);
  }
}

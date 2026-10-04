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
import { CreateOrderDto } from './dtos/create-order.dto.js';
import { OrderQueryDto } from './dtos/order-query.dto.js';
import { UpdateOrderDto } from './dtos/update-order.dto.js';
import { OrderService } from './providers/order.service.js';

const orderReaders = Object.values(UserRole);
const orderOperators = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
];

@Controller('orders')
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Get()
  @Roles(...orderReaders)
  findAll(
    @Query() query: OrderQueryDto,
    @ActiveUser() user: ActiveUserDto,
    @Req() request: Request,
  ) {
    return this.orders.findAll(query, user, request);
  }

  @Post()
  @Roles(...orderOperators)
  create(@Body() dto: CreateOrderDto, @ActiveUser() user: ActiveUserDto) {
    return this.orders.create(dto, user);
  }

  @Get(':id')
  @Roles(...orderReaders)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.orders.findOne(id, user);
  }

  @Patch(':id')
  @Roles(...orderOperators)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.orders.update(id, dto, user);
  }

  @Post(':id/complete')
  @Roles(...orderOperators)
  complete(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.orders.complete(id, user);
  }

  @Delete(':id')
  @Roles(...orderOperators)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.orders.cancel(id, user);
  }
}

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
import { UserRole } from '../generated/prisma/enums.js';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { BranchService } from './providers/branch.service.js';
import { CreateBranchDto } from './dtos/create-branch.dto.js';
import { UpdateBranchDto } from './dtos/update-branch.dto.js';
import { BranchQueryDto } from './dtos/branch-query.dto.js';

@Controller('branches')
export class BranchController {
  constructor(private readonly branches: BranchService) {}

  @Get()
  findAll(
    @Query() query: BranchQueryDto,
    @ActiveUser() user: ActiveUserDto,
    @Req() request: Request,
  ) {
    return this.branches.findAll(query, user, request);
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  create(@Body() dto: CreateBranchDto, @ActiveUser() user: ActiveUserDto) {
    return this.branches.create(dto, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.branches.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBranchDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.branches.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.branches.deactivate(id, user);
  }
}

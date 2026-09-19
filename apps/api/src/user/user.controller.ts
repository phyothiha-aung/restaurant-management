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
import { UserService } from './providers/user.service.js';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { UpdateUserDto } from './dtos/update-user.dto.js';
import { UpdateSelfDto } from './dtos/update-self.dto.js';
import { UserQueryDto } from './dtos/user-query.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';

const managerRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.BRANCH_MANAGER,
];

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @Roles(...managerRoles)
  findAll(
    @Query() query: UserQueryDto,
    @ActiveUser() user: ActiveUserDto,
    @Req() request: Request,
  ) {
    return this.users.findAll(query, user, request);
  }

  @Post()
  @Roles(...managerRoles)
  create(@Body() dto: CreateUserDto, @ActiveUser() user: ActiveUserDto) {
    return this.users.create(dto, user);
  }

  @Get('me')
  findMe(@ActiveUser('sub', ParseIntPipe) id: number) {
    return this.users.findMe(id);
  }

  @Patch('me')
  updateSelf(
    @ActiveUser('sub', ParseIntPipe) id: number,
    @Body() dto: UpdateSelfDto,
  ) {
    return this.users.updateSelf(id, dto);
  }

  @Get(':id')
  @Roles(...managerRoles)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.users.findOneManaged(id, user);
  }

  @Patch(':id')
  @Roles(...managerRoles)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.users.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...managerRoles)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.users.deactivate(id, user);
  }
}

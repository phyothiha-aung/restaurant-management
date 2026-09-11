import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { UserService } from './providers/user.service.js';

import { CreateUserDto } from './dtos/create-user.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  public async findAll() {
    return await this.userService.findAll();
  }

  @Post()
  @Roles(UserRole.SUPERADMIN)
  public async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);

    return this.userService.sanitizedUser(user);
  }

  @Get('my-detail')
  public async getMyDetail(@ActiveUser('sub', ParseIntPipe) id: number) {
    return await this.userService.findSanitizedUserById(id);
  }

  @Get('my-restaurant')
  public getUsersFromRestaurant(@ActiveUser() activeUser: ActiveUserDto) {
    return activeUser;
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  public async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.findSanitizedUserById(id);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.BRANCH_MANAGER,
  )
  public async delete(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() activeUser: ActiveUserDto,
  ) {
    return await this.userService.delete(id, activeUser);
  }
}

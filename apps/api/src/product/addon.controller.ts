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
import { AddonQueryDto } from './dtos/addon-query.dto.js';
import { CreateAddonDto, UpdateAddonDto } from './dtos/addon.dto.js';
import { AddonService } from './providers/addon.service.js';

const addonReaderRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
];

const addonManagerRoles = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
];

@Controller('addons')
export class AddonController {
  constructor(private readonly addons: AddonService) {}

  @Get()
  @Roles(...addonReaderRoles)
  findAll(
    @Query() query: AddonQueryDto,
    @ActiveUser() user: ActiveUserDto,
    @Req() request: Request,
  ) {
    return this.addons.findAll(query, user, request);
  }

  @Post()
  @Roles(...addonManagerRoles)
  create(@Body() dto: CreateAddonDto, @ActiveUser() user: ActiveUserDto) {
    return this.addons.create(dto, user);
  }

  @Get(':id')
  @Roles(...addonReaderRoles)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.addons.findOne(id, user);
  }

  @Patch(':id')
  @Roles(...addonManagerRoles)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddonDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.addons.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...addonManagerRoles)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.addons.deactivate(id, user);
  }
}

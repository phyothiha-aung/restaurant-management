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
} from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { CreateDiningTableDto } from './dtos/create-dining-table.dto.js';
import { DiningTableQueryDto } from './dtos/dining-table-query.dto.js';
import { UpdateDiningTableDto } from './dtos/update-dining-table.dto.js';
import { DiningTableService } from './providers/dining-table.service.js';

const readers = Object.values(UserRole);
const managers = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
];

@Controller('tables')
export class DiningTableController {
  constructor(private readonly tables: DiningTableService) {}

  @Get()
  @Roles(...readers)
  findAll(
    @Query() query: DiningTableQueryDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.tables.findAll(query, user);
  }

  @Post()
  @Roles(...managers)
  create(
    @Body() dto: CreateDiningTableDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.tables.create(dto, user);
  }

  @Get(':id')
  @Roles(...readers)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.tables.findOne(id, user);
  }

  @Patch(':id')
  @Roles(...managers)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiningTableDto,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.tables.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(...managers)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @ActiveUser() user: ActiveUserDto,
  ) {
    return this.tables.deactivate(id, user);
  }
}

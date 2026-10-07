import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import type { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { UpdateRestaurantSettingsDto } from './dtos/update-restaurant-settings.dto.js';
import { RestaurantSettingsService } from './restaurant-settings.service.js';

const readers = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
];
const editors = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OWNER];

@Controller('restaurant-settings')
export class RestaurantSettingsController {
  constructor(private readonly settings: RestaurantSettingsService) {}

  @Get()
  @Roles(...readers)
  findOne() {
    return this.settings.getSettings();
  }

  @Patch()
  @Roles(...editors)
  update(
    @Body() dto: UpdateRestaurantSettingsDto,
    @ActiveUser() actor: ActiveUserDto,
  ) {
    return this.settings.update(dto, actor);
  }
}

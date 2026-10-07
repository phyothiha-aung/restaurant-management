import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import type { ActiveUserDto } from '../auth/dtos/active-user.dto.js';
import { UserRole } from '../generated/prisma/enums.js';
import { UpdateRestaurantSettingsDto } from './dtos/update-restaurant-settings.dto.js';
import { RestaurantSettingsService } from './restaurant-settings.service.js';
import { RestaurantLogoService } from './restaurant-logo.service.js';
import { PresignRestaurantLogoDto } from './dtos/presign-restaurant-logo.dto.js';
import { AttachRestaurantLogoDto } from './dtos/attach-restaurant-logo.dto.js';

const readers = [
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
];
const editors = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OWNER];

@Controller('restaurant-settings')
export class RestaurantSettingsController {
  constructor(
    private readonly settings: RestaurantSettingsService,
    private readonly logo: RestaurantLogoService,
  ) {}

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

  @Post('logo/presign')
  @Roles(...editors)
  presignLogo(
    @Body() dto: PresignRestaurantLogoDto,
    @ActiveUser() actor: ActiveUserDto,
  ) {
    return this.logo.presign(dto, actor);
  }

  @Post('logo/uploads/:fileId/complete')
  @Roles(...editors)
  completeLogo(
    @Param('fileId') fileId: string,
    @ActiveUser() actor: ActiveUserDto,
  ) {
    return this.logo.complete(fileId, actor);
  }

  @Put('logo')
  @Roles(...editors)
  attachLogo(
    @Body() dto: AttachRestaurantLogoDto,
    @ActiveUser() actor: ActiveUserDto,
  ) {
    return this.logo.attach(dto, actor);
  }

  @Delete('logo')
  @Roles(...editors)
  removeLogo(@ActiveUser() actor: ActiveUserDto) {
    return this.logo.remove(actor);
  }
}

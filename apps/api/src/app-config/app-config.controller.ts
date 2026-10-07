import { Controller, Get } from '@nestjs/common';
import type { AppConfig } from '@restaurant-management/shared';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { AuthType } from '../auth/constants/auth.constant.js';
import { RestaurantSettingsService } from './restaurant-settings.service.js';

@Controller('config')
export class AppConfigController {
  constructor(private readonly settings: RestaurantSettingsService) {}

  @Auth(AuthType.NONE)
  @Get()
  getConfig(): Promise<AppConfig> {
    return this.settings.getPublicConfig();
  }
}

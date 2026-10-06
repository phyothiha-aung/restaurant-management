import { Controller, Get } from '@nestjs/common';
import type { AppConfig } from '@restaurant-management/shared';
import { Auth } from '../auth/decorators/auth.decorator.js';
import { AuthType } from '../auth/constants/auth.constant.js';
import { BusinessTimeService } from './business-time.service.js';

@Controller('config')
export class AppConfigController {
  constructor(private readonly businessTime: BusinessTimeService) {}

  @Auth(AuthType.NONE)
  @Get()
  getConfig(): AppConfig {
    return { timeZone: this.businessTime.timeZone };
  }
}

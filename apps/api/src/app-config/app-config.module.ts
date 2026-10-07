import { Global, Module } from '@nestjs/common';
import { AppConfigController } from './app-config.controller.js';
import { BusinessTimeService } from './business-time.service.js';
import { RestaurantSettingsController } from './restaurant-settings.controller.js';
import { RestaurantSettingsService } from './restaurant-settings.service.js';

@Global()
@Module({
  controllers: [AppConfigController, RestaurantSettingsController],
  providers: [BusinessTimeService, RestaurantSettingsService],
  exports: [BusinessTimeService, RestaurantSettingsService],
})
export class AppConfigModule {}

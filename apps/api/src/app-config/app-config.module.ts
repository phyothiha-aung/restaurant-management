import { Global, Module } from '@nestjs/common';
import { AppConfigController } from './app-config.controller.js';
import { BusinessTimeService } from './business-time.service.js';
import { RestaurantSettingsController } from './restaurant-settings.controller.js';
import { RestaurantSettingsService } from './restaurant-settings.service.js';
import { RestaurantLogoService } from './restaurant-logo.service.js';
import { UserModule } from '../user/user.module.js';
import { StorageModule } from '../storage/storage.module.js';

@Global()
@Module({
  imports: [UserModule, StorageModule],
  controllers: [AppConfigController, RestaurantSettingsController],
  providers: [
    BusinessTimeService,
    RestaurantSettingsService,
    RestaurantLogoService,
  ],
  exports: [BusinessTimeService, RestaurantSettingsService],
})
export class AppConfigModule {}

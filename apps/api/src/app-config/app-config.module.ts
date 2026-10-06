import { Global, Module } from '@nestjs/common';
import { AppConfigController } from './app-config.controller.js';
import { BusinessTimeService } from './business-time.service.js';

@Global()
@Module({
  controllers: [AppConfigController],
  providers: [BusinessTimeService],
  exports: [BusinessTimeService],
})
export class AppConfigModule {}

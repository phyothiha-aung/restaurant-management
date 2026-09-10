import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './providers/user.service.js';
import { PermissionProvider } from './providers/permission.provider.js';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, PermissionProvider],
  exports: [UserService],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './providers/user.service.js';
import { PermissionProvider } from './providers/permission.provider.js';
import { PaginationModule } from '../common/pagination/pagination.module.js';

@Module({
  imports: [PaginationModule],
  controllers: [UserController],
  providers: [UserService, PermissionProvider],
  exports: [UserService, PermissionProvider],
})
export class UserModule {}

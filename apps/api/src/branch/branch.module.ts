import { Module } from '@nestjs/common';
import { PaginationModule } from '../common/pagination/pagination.module.js';
import { UserModule } from '../user/user.module.js';
import { BranchController } from './branch.controller.js';
import { BranchService } from './providers/branch.service.js';

@Module({
  imports: [PaginationModule, UserModule],
  controllers: [BranchController],
  providers: [BranchService],
})
export class BranchModule {}

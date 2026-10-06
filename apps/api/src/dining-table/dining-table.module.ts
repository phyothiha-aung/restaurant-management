import { Module } from '@nestjs/common';
import { PaginationModule } from '../common/pagination/pagination.module.js';
import { UserModule } from '../user/user.module.js';
import { DiningTableController } from './dining-table.controller.js';
import { DiningTableService } from './providers/dining-table.service.js';

@Module({
  imports: [PaginationModule, UserModule],
  controllers: [DiningTableController],
  providers: [DiningTableService],
})
export class DiningTableModule {}

import { Module } from '@nestjs/common';
import { PaginationModule } from '../common/pagination/pagination.module.js';
import { UserModule } from '../user/user.module.js';
import { ExpenseController } from './expense.controller.js';
import { ExpenseService } from './providers/expense.service.js';
import { ExpenseAttachmentService } from './providers/expense-attachment.service.js';

@Module({
  imports: [PaginationModule, UserModule],
  controllers: [ExpenseController],
  providers: [ExpenseService, ExpenseAttachmentService],
})
export class ExpenseModule {}
